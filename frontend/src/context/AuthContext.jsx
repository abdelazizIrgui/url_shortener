import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ENDPOINTS } from "../config.js";
import {
  apiFetch,
  getToken,
  setToken,
  clearAuthTokens,
  onAuthExpired,
} from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = getToken();
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const data = await apiFetch(ENDPOINTS.me);
      // data.user includes avatarBase64 from the server
      setUser(data.user);
    } catch {
      clearAuthTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  // Let api.js tell us when a session couldn't be refreshed (refresh token
  // missing/invalid/expired) so the UI logs the user out right away instead
  // of only discovering it on the next failed request.
  useEffect(() => {
    onAuthExpired(() => setUser(null));
  }, []);

  const login = async (email, password) => {
    const data = await apiFetch(ENDPOINTS.login, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, phone, gender, age, avatarBase64 = "", country = "", countryCode = "") => {
    const data = await apiFetch(ENDPOINTS.register, {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone, gender, age, avatarBase64, country, countryCode }),
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const googleLogin = async (googlePayload) => {
    const data = await apiFetch(ENDPOINTS.googleLogin, {
      method: "POST",
      body: JSON.stringify(googlePayload),
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    // Best-effort — revoke the refresh token server-side (it's sent
    // automatically via the httpOnly cookie) so it can't be used again, but
    // don't block clearing local state on the network call.
    apiFetch(ENDPOINTS.logout, { method: "POST" }).catch(() => {});
    clearAuthTokens();
    setUser(null);
  };

  // Called after updateMe to sync the user in state without a full reload
  const refreshUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, googleLogin, logout, refreshUser, isAuthed: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
