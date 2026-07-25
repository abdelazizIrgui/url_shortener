import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext.jsx";
import { ENDPOINTS } from "../config.js";
import { apiFetch } from "../api.js";

function MailIcon() {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
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

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch(ENDPOINTS.forgotPassword, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err.message || t.errorFallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: "32px 20px", position: "relative",
    }}>
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
        backgroundSize: "28px 28px", pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 400 }}>
        <Link to="/" style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 32,
          textDecoration: "none", justifyContent: "center",
        }}>
          <span style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--accent-dim)", color: "var(--accent-text)",
            border: "1px solid var(--border-light)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ChainIcon />
          </span>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
            LinkBlick
          </span>
        </Link>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)", padding: "32px 28px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}>
          {sent ? (
            <>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(46,204,113,0.12)", color: "var(--success)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, marginBottom: 16,
              }}>
                ✓
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "var(--text)" }}>
                {t.forgotPasswordTitle || "Reset your password"}
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 13.5, lineHeight: 1.6, margin: "0 0 20px" }}>
                {t.forgotPasswordSuccess || "If an account exists for that email, we've sent a password reset link. Check your inbox."}
              </p>
              <Link to="/login" style={{ color: "var(--accent-text)", fontWeight: 600, fontSize: 13.5, textDecoration: "none" }}>
                {t.forgotPasswordBackToLogin || "← Back to log in"}
              </Link>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "var(--text)" }}>
                {t.forgotPasswordTitle || "Reset your password"}
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 13.5, lineHeight: 1.6, margin: "0 0 22px" }}>
                {t.forgotPasswordSub || "Enter the email on your account and we'll send you a link to reset your password."}
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {t.authEmailLabel || "Email"}
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{ position: "absolute", left: 13, color: "var(--muted)", display: "flex" }}>
                      <MailIcon />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.authEmailPlaceholder || "you@example.com"}
                      required
                      autoComplete="email"
                      dir="ltr"
                      style={{
                        width: "100%", background: "var(--surface-2)",
                        border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                        color: "var(--text)", fontSize: 14, fontFamily: "var(--font-body)",
                        padding: "12px 14px 12px 40px", outline: "none",
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 9,
                    background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.25)",
                    borderRadius: "var(--radius-md)", padding: "10px 14px",
                    color: "var(--warm)", fontSize: 13,
                  }}>
                    <span style={{ fontSize: 15 }}>⚠</span> {error}
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
                  }}
                >
                  {loading ? (t.forgotPasswordSending || "Sending…") : (t.forgotPasswordSubmit || "Send reset link")}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: 13, marginTop: 20 }}>
                <Link to="/login" style={{ color: "var(--accent-text)", fontWeight: 600, textDecoration: "none" }}>
                  {t.forgotPasswordBackToLogin || "← Back to log in"}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
