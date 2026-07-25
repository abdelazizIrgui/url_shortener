import { ENDPOINTS } from "./config.js";

const TOKEN_KEY = "linkblick_token";
const CSRF_COOKIE = "csrfToken";

// The access token is short-lived (15m) and kept in localStorage so it can
// be attached to every request via the Authorization header. The refresh
// token is NOT stored here at all anymore — the backend sets it as an
// httpOnly Secure cookie, so client-side JS never has access to it (and
// can't leak it via XSS). The browser attaches it automatically on calls
// to /api/auth/refresh and /api/auth/logout.
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const clearAuthTokens = () => {
  clearToken();
};

// Reads the (intentionally non-httpOnly) CSRF cookie the backend issues
// alongside the refresh-token cookie, so it can be echoed back in a header
// on /refresh and /logout — the double-submit pattern that protects those
// two cookie-authenticated endpoints from CSRF.
export const getCsrfToken = () => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

// api.js has no React state of its own — when a session can't be recovered
// (refresh cookie missing/invalid) it calls this so AuthContext can clear the
// logged-in user and the UI (ProtectedRoute etc.) reacts immediately.
let authExpiredHandler = null;
export const onAuthExpired = (fn) => {
  authExpiredHandler = fn;
};

// De-dupes concurrent refresh attempts — if five requests 401 at once we
// only want a single call to /auth/refresh, with everyone else awaiting it.
let refreshPromise = null;

async function performRefresh() {
  const res = await fetch(ENDPOINTS.refresh, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken() || "",
    },
    credentials: "include", // send the httpOnly refresh cookie
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Session expired");

  setToken(data.token);
  return data.token;
}

const isAuthEndpoint = (url) =>
  [ENDPOINTS.refresh, ENDPOINTS.login, ENDPOINTS.register, ENDPOINTS.googleLogin].includes(url);

// غلاف لـ fetch يضيف رؤوس التوثيق ويرمي رسالة الخطأ القادمة من السيرفر
// Also transparently refreshes the access token once on a 401 and retries
// the original request, so an expired short-lived token never logs the
// user out mid-session as long as their refresh cookie is still valid.
export async function apiFetch(url, options = {}, _isRetry = false) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  // Harmless to attach on every request — the server only checks it on
  // /refresh and /logout, and it's a no-op for everything else.
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

  const res = await fetch(url, { ...options, headers, credentials: "include" });

  // Only worth attempting a refresh if we might actually have a session —
  // the CSRF cookie is set alongside the refresh cookie at login, so its
  // presence is a reasonable (readable) stand-in for "we might be logged in".
  if (res.status === 401 && !_isRetry && csrfToken && !isAuthEndpoint(url)) {
    try {
      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      return apiFetch(url, options, true);
    } catch {
      clearAuthTokens();
      if (authExpiredHandler) authExpiredHandler();
      // fall through — original 401 below still gets thrown to the caller
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    // Express's built-in 413 (payload too large) response has no JSON body,
    // so `data` is null here and the generic fallback below would show the
    // user a raw "Request failed (413)" — not helpful. Give it a proper
    // code so callers (e.g. BioLinkEditorPage) can show a translated,
    // human message like "that image is too large" instead.
    if (res.status === 413) {
      const err = new Error("The data you're sending is too large.");
      err.status = 413;
      err.code = "PAYLOAD_TOO_LARGE";
      throw err;
    }
    const message = data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }

  return data;
}
