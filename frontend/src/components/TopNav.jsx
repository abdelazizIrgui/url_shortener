import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChainIcon, LangDropdown, UserIcon, MenuIcon, CloseIcon, SunIcon, MoonIcon } from "./Shared.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { BRAND_NAME } from "../i18n.js";

export default function TopNav() {
  const { lang, setLang, t } = useLang();
  const { isAuthed, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); };
  const closeMenu = () => setMenuOpen(false);

  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();
  const hasAvatar = !!user?.avatarBase64;

  return (
    <header className="header">
      <Link to="/" className="logo" onClick={closeMenu}>
        <span className="logo-icon-wrap">
          <ChainIcon size={16} />
        </span>
        <span>{BRAND_NAME}</span>
      </Link>

      <div className="header-right">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? (t.themeSwitchToLight || "Switch to light mode") : (t.themeSwitchToDark || "Switch to dark mode")}
          title={theme === "dark" ? (t.themeSwitchToLight || "Switch to light mode") : (t.themeSwitchToDark || "Switch to dark mode")}
        >
          {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>
        <LangDropdown lang={lang} onChange={setLang} />
        {isAuthed ? (
          <>
            <Link to="/dashboard" className="nav-link">{t.navDashboard}</Link>
            <Link to="/campaigns" className="nav-link">{t.navCampaigns || "Campaigns"}</Link>
            <Link to="/bio-editor" className="nav-link">{t.navBioLink || "Bio Link"}</Link>
            {user?.role === "admin" && (
              <Link to="/admin" className="nav-link">{t.navAdmin}</Link>
            )}

            {/* Profile avatar button */}
            <Link
              to="/profile"
              className="profile-avatar"
              title={t.navProfile || "Profile"}
              aria-label={t.navProfile || "Profile"}
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: hasAvatar ? "transparent" : "var(--accent-dim)",
                color: "var(--accent-text)",
                border: `2px solid ${hasAvatar ? "var(--accent)" : "var(--border-light)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 14, fontFamily: "var(--font-display)",
                textDecoration: "none", flexShrink: 0, overflow: "hidden",
                transition: "border-color 0.15s",
              }}
            >
              {hasAvatar
                ? <img src={user.avatarBase64} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                : (initial !== "?" ? initial : <UserIcon size={16} />)
              }
            </Link>

            <button type="button" className="nav-btn" onClick={handleLogout}>
              {t.navLogout}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">{t.navLogin}</Link>
            <Link to="/login?mode=register" className="nav-btn nav-btn-primary">{t.navSignup || "Sign up"}</Link>
          </>
        )}
      </div>

      {/* Hamburger toggle — only visible on small screens via CSS */}
      <button
        type="button"
        className="hamburger-btn"
        aria-label={menuOpen ? (t.navCloseMenu || "Close menu") : (t.navOpenMenu || "Open menu")}
        aria-expanded={menuOpen}
        aria-controls="mobile-nav-panel"
        onClick={() => setMenuOpen((o) => !o)}
      >
        {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
      </button>

      {/* Mobile dropdown panel */}
      {menuOpen && (
        <div className="mobile-nav" id="mobile-nav-panel">
          <div className="mobile-nav-lang">
            <LangDropdown lang={lang} onChange={setLang} />
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? (t.themeSwitchToLight || "Switch to light mode") : (t.themeSwitchToDark || "Switch to dark mode")}
              title={theme === "dark" ? (t.themeSwitchToLight || "Switch to light mode") : (t.themeSwitchToDark || "Switch to dark mode")}
            >
              {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>
          </div>

          {isAuthed ? (
            <>
              <Link to="/dashboard" className="mobile-nav-link" onClick={closeMenu}>{t.navDashboard}</Link>
              <Link to="/campaigns" className="mobile-nav-link" onClick={closeMenu}>{t.navCampaigns || "Campaigns"}</Link>
              <Link to="/bio-editor" className="mobile-nav-link" onClick={closeMenu}>{t.navBioLink || "Bio Link"}</Link>
              {user?.role === "admin" && (
                <Link to="/admin" className="mobile-nav-link" onClick={closeMenu}>{t.navAdmin}</Link>
              )}
              <Link to="/profile" className="mobile-nav-link" onClick={closeMenu}>{t.navProfile || "Profile"}</Link>
              <button
                type="button"
                className="mobile-nav-link mobile-nav-link-btn"
                onClick={() => { closeMenu(); handleLogout(); }}
              >
                {t.navLogout}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-link" onClick={closeMenu}>{t.navLogin}</Link>
              <Link to="/login?mode=register" className="mobile-nav-link mobile-nav-link-primary" onClick={closeMenu}>{t.navSignup || "Sign up"}</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
