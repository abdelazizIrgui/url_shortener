// Centralizes the flags used on every cookie we set, so "secure cookie"
// behavior (httpOnly, Secure in production, SameSite) lives in one place
// instead of being repeated (and potentially drifting) at each call site.

const REFRESH_COOKIE = "refreshToken";
const CSRF_COOKIE = "csrfToken";

const isProd = () => process.env.NODE_ENV === "production";

const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);

// "lax" works when the frontend and API share a registrable domain (e.g.
// app.example.com talking to api.example.com, or same-origin) — this is
// the default. If they're on genuinely different domains (e.g. a Vercel
// frontend + a Render/Railway backend), the browser treats that as
// cross-site and Lax/Strict cookies won't be sent on fetch/XHR at all, so
// set COOKIE_SAME_SITE=none in that case. Per spec, SameSite=None requires
// the Secure flag regardless of NODE_ENV — browsers silently drop the
// cookie otherwise — so we force `secure` on whenever "none" is selected.
const SAME_SITE = ["strict", "lax", "none"].includes(process.env.COOKIE_SAME_SITE)
  ? process.env.COOKIE_SAME_SITE
  : "lax";
const secureFlag = () => isProd() || SAME_SITE === "none";

// Scoped to /api/auth — the only routes that ever need to read it — so it
// isn't sent on every single API request.
const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: secureFlag(),
    sameSite: SAME_SITE,
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
};

module.exports = {
  REFRESH_COOKIE,
  CSRF_COOKIE,
  SAME_SITE,
  isProd,
  secureFlag,
  setRefreshCookie,
  clearRefreshCookie,
};
