import { useState, useEffect, useCallback } from "react";
import { useNavigate, Navigate, Link, useSearchParams } from "react-router-dom";
import { useLang } from "../context/LangContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { GOOGLE_CLIENT_ID } from "../config.js";
import AvatarUploader from "../components/AvatarUploader.jsx";
import CountrySelect from "../components/CountrySelect.jsx";
import { findCountryByName } from "../utils/countries.js";
import { calcAge, MIN_BIRTH_DATE, MAX_BIRTH_DATE } from "../utils/age.js";

/* ── Google glyph ── */
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.55-5.17 3.55-8.89z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.95-2.84l-3.88-3.02c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A11.998 11.998 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.34A7.2 7.2 0 0 1 4.89 12c0-.81.14-1.6.38-2.34V6.55H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.45z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.55l4 3.11C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function ChainIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.5 13.5 13.5 10.5" strokeLinecap="round" />
      <path d="M8 16.5 5.5 19a3.5 3.5 0 0 1-5-5L3 11.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 7.5 18.5 5a3.5 3.5 0 0 1 5 5L21 12.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: "rgba(61,220,132,0.18)",
        border: "1px solid rgba(61,220,132,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: 17,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#e8eaf2", marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "rgba(232,234,242,0.5)", lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
}

function AuthField({ label, type, value, onChange, placeholder, icon, required, minLength, min, max, autoComplete }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{
          position: "absolute", left: 13, color: focused ? "var(--accent-text)" : "var(--muted)",
          pointerEvents: "none", display: "flex", transition: "color 0.15s",
        }}>{icon}</span>
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          min={min}
          max={max}
          autoComplete={autoComplete}
          dir="ltr"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            background: "var(--surface-2)",
            border: `1px solid ${focused ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-md)",
            color: "var(--text)", fontSize: 14,
            fontFamily: "var(--font-body)",
            padding: isPassword ? "12px 44px 12px 40px" : "12px 14px 12px 40px",
            outline: "none",
            boxShadow: focused ? "0 0 0 3px var(--accent-dim)" : "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            style={{
              position: "absolute", right: 12,
              background: "none", border: "none",
              color: "var(--muted)", cursor: "pointer",
              display: "flex", padding: 0,
            }}
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function MailIcon() {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
}
function LockIcon() {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function PhoneIcon() {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
}
function CalendarIcon() {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
}

// ── Name / phone / age validation (mirrors backend rules) ──────────────────
const NAME_REGEX = /^[a-zA-ZÀ-ÖØ-öø-ÿ' -]{2,60}$/;
const PHONE_REGEX = /^\+?[0-9\s\-().]{8,20}$/;

function GenderSelect({ value, onChange, label }) {
  const options = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </label>
      <div style={{ display: "flex", gap: 10 }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                background: active ? "var(--accent-dim)" : "var(--surface-2)",
                color: active ? "var(--accent-text)" : "var(--text)",
                fontFamily: "var(--font-body)",
                fontSize: 13.5, fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useLang();
  const { login, register, googleLogin, isAuthed, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  if (!authLoading && isAuthed) {
    return <Navigate to="/dashboard" replace />;
  }

  const [mode, setMode] = useState(searchParams.get("mode") === "register" ? "register" : "login");

  useEffect(() => {
    const wanted = searchParams.get("mode") === "register" ? "register" : "login";
    setMode(wanted);
  }, [searchParams]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Selecting a country prefills the phone field with its dial code (and
  // swaps the old dial code out if the person picks a different country
  // after already starting to type their number).
  const handleCountryChange = (name, dial) => {
    setCountry(name);
    setPhone((prev) => {
      const prevDial = countryCode;
      const rest = prevDial && prev.startsWith(prevDial) ? prev.slice(prevDial.length) : (prev.startsWith("+") ? "" : prev);
      return `${dial} ${rest}`.trim();
    });
    setCountryCode(dial);
  };

  // ── Client-side validation for the sign-up form (backend re-validates too) ──
  const validateRegisterFields = () => {
    if (!name.trim() || !NAME_REGEX.test(name.trim()))
      return "Name must contain only letters and be at least 2 characters";
    if (!country || !countryCode)
      return "Please select your country";
    if (!phone.trim() || !PHONE_REGEX.test(phone.trim()))
      return "Please enter a valid phone number";
    if (!phone.trim().startsWith(countryCode))
      return `Phone number must start with ${countryCode} for the selected country`;
    if (!gender) return "Please select a gender";
    if (!birthDate) return "Please select your date of birth";
    const ageNum = calcAge(birthDate);
    if (ageNum === null || ageNum < 13 || ageNum > 120)
      return "You must be between 13 and 120 years old";
    return "";
  };

  // ── Email/password submit ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      const fieldError = validateRegisterFields();
      if (fieldError) { setError(fieldError); return; }
    }

    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password, phone, gender, calcAge(birthDate), avatar, country, countryCode);
      navigate("/dashboard");
    } catch (err) {
      setError((err.code === "ACCOUNT_SUSPENDED" && t.authAccountSuspended) || err.message || t.errorFallback);
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign-In callback ────────────────────────────────────────────────
  const handleGoogleCredential = useCallback(async (response) => {
    setError("");
    setGoogleLoading(true);
    try {
      // response.credential is the Google ID Token — sent to backend for verification
      await googleLogin({ credential: response.credential });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || t.errorFallback);
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLogin, navigate, t.errorFallback]);

  // ── Load Google Identity Services script ──────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const loadGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { type: "standard", theme: "outline", size: "large", width: "100%", text: "continue_with" }
        );
      }
    };

    if (window.google?.accounts?.id) {
      loadGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = loadGoogle;
      document.head.appendChild(script);
    }
  }, [handleGoogleCredential, mode]);

  const isLogin = mode === "login";

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      background: "var(--bg)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* ambient grid */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
        backgroundSize: "28px 28px",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* ════ LEFT PANEL ════ */}
      <div style={{
        position: "relative", zIndex: 1,
        background: "linear-gradient(135deg, #140c30 0%, #153d4c 45%, #16a085 100%)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        padding: "48px 52px",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 64 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "rgba(22,160,133,0.3)",
            border: "1px solid rgba(22,160,133,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#7fe8d2",
          }}>
            <ChainIcon />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#e8eaf2", letterSpacing: "-0.02em" }}>
            LinkBlick
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em",
            color: "#fff", lineHeight: 1.2, marginBottom: 14,
          }}>
            Shorter links.<br />
            <span style={{ color: "#2fd9b8" }}>More insights.</span>
          </h1>
          <p style={{ color: "rgba(232,234,242,0.6)", fontSize: 14.5, lineHeight: 1.7, marginBottom: 44 }}>
            Create short links, track every click with real analytics, and build your bio page — all in one place.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Feature icon="🔗" title="Short links in seconds" desc="Random slug, auto-generated, collision-free." />
            <Feature icon="📊" title="Real-time analytics" desc="Countries, devices, referrers — 14-day chart." />
            <Feature icon="🗂️" title="Campaigns & A/B testing" desc="Group links and split traffic by weight." />
            <Feature icon="🌐" title="Bio Link page" desc="One public page for all your links." />
          </div>
        </div>
      </div>

      {/* ════ RIGHT PANEL (form) ════ */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 40px",
        overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700,
              letterSpacing: "-0.02em", color: "var(--text)", margin: "0 0 6px",
            }}>
              {isLogin ? "Welcome back" : "Start for free"}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13.5, margin: 0 }}>
              {isLogin ? "Sign in to access your dashboard" : "Create your account — no credit card needed"}
            </p>
          </div>

          {/* ── Google Sign-In ── */}
          {GOOGLE_CLIENT_ID ? (
            <div style={{ marginBottom: 22 }}>
              {googleLoading ? (
                <div style={{
                  padding: "12px 16px", borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)", textAlign: "center",
                  fontSize: 13, color: "var(--muted)",
                }}>
                  Signing in with Google…
                </div>
              ) : (
                <div id="google-signin-btn" style={{ width: "100%" }} />
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "12px 16px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text)", fontFamily: "var(--font-body)",
                fontSize: 13.5, fontWeight: 600, cursor: "not-allowed",
                opacity: 0.45, marginBottom: 22,
              }}
            >
              <GoogleGlyph />
              {t.authGoogleBtn || "Continue with Google"}
            </button>
          )}

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{t.authOr || "or"}</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {!isLogin && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase", alignSelf: "flex-start" }}>
                  Profile photo (optional)
                </span>
                <AvatarUploader current={avatar} onChange={setAvatar} size={72} />
              </div>
            )}
            {!isLogin && (
              <AuthField
                label={t.authNameLabel || "Full name"}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.authNamePlaceholder || "Your name"}
                icon={<UserIcon />}
                required
                minLength={2}
                autoComplete="name"
              />
            )}
            {!isLogin && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Country
                </label>
                <CountrySelect value={country} onChange={handleCountryChange} />
              </div>
            )}
            {!isLogin && (
              <AuthField
                label="Phone number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={countryCode ? `${countryCode} ...` : "Select your country first"}
                icon={<PhoneIcon />}
                required
                autoComplete="tel"
              />
            )}
            {!isLogin && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <GenderSelect value={gender} onChange={setGender} label="Gender" />
              </div>
            )}
            {!isLogin && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <AuthField
                  label="Date of birth"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  icon={<CalendarIcon />}
                  required
                  min={MIN_BIRTH_DATE}
                  max={MAX_BIRTH_DATE}
                  autoComplete="bday"
                />
                {birthDate && calcAge(birthDate) !== null && (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    Age: {calcAge(birthDate)}
                  </span>
                )}
              </div>
            )}
            <AuthField
              label={t.authEmailLabel || "Email"}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.authEmailPlaceholder || "you@example.com"}
              icon={<MailIcon />}
              required
              autoComplete="email"
            />
            <AuthField
              label={t.authPasswordLabel || "Password"}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.authPasswordPlaceholder || "At least 6 characters"}
              icon={<LockIcon />}
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />

            {isLogin && (
              <Link
                to="/forgot-password"
                style={{
                  alignSelf: "flex-end", marginTop: -8,
                  fontSize: 12.5, color: "var(--accent-text)",
                  fontWeight: 600, textDecoration: "none",
                }}
              >
                {t.authForgotPasswordLink || "Forgot password?"}
              </Link>
            )}

            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 9,
                background: "rgba(255,107,107,0.08)",
                border: "1px solid rgba(255,107,107,0.25)",
                borderRadius: "var(--radius-md)", padding: "10px 14px",
                color: "var(--warm)", fontSize: 13,
              }}>
                <span style={{ fontSize: 15 }}>⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "13px 16px",
                background: loading ? "var(--border)" : "var(--accent)",
                border: "none", borderRadius: "var(--radius-pill)",
                color: "var(--on-accent)", fontFamily: "var(--font-body)",
                fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 20px rgba(0,0,0,0.35)",
                transition: "all 0.18s", marginTop: 4,
              }}
            >
              {loading
                ? (isLogin ? "Signing in…" : "Creating account…")
                : (isLogin ? (t.authSubmitLogin || "Log in") : (t.authSubmitRegister || "Create account"))
              }
            </button>
          </form>

          {/* Toggle login / register */}
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 22 }}>
            {isLogin ? (t.authToggleToRegister || "Don't have an account?") : (t.authToggleToLogin || "Already have an account?")}{" "}
            <button
              type="button"
              onClick={() => { setMode(isLogin ? "register" : "login"); setError(""); }}
              style={{
                background: "none", border: "none", padding: 0,
                color: "var(--accent-text)", fontWeight: 600, fontSize: 13,
                cursor: "pointer", fontFamily: "var(--font-body)",
              }}
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>

        </div>
      </div>

      {/* Mobile: stack vertically */}
      <style>{`
        @media (max-width: 680px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="background: linear-gradient(135deg"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
