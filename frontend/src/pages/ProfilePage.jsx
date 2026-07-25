import { useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav.jsx";
import Footer from "../components/Footer.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCookieConsent } from "../context/CookieConsentContext.jsx";
import { ZapIcon, MailIcon, GlobeIcon, UserIcon, CalendarIcon } from "../components/Shared.jsx";

function VerifiedPill({ verified, verifiedLabel, unverifiedLabel }) {
  return (
    <span className="pill" style={{
      background: verified ? "var(--accent-dim)" : "var(--warm-dim)",
      color: verified ? "var(--accent-text)" : "var(--warm)",
    }}>
      {verified ? `✓ ${verifiedLabel}` : unverifiedLabel}
    </span>
  );
}

// Read-only label/value row — profile info is displayed but cannot be edited.
function InfoRow({ icon, label, value, trailing }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, padding: "14px 0", borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {icon && (
          <div style={{
            width: 32, height: 32, borderRadius: "var(--radius-sm)",
            background: "var(--surface-2)", color: "var(--text-secondary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)",
            letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 3,
          }}>
            {label}
          </div>
          <div style={{ fontSize: 14.5, color: "var(--text)", wordBreak: "break-word" }}>
            {value}
          </div>
        </div>
      </div>
      {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useLang();
  const { user, logout } = useAuth();
  const { openPreferences } = useCookieConsent();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  const genderLabel =
    user?.gender === "male" ? (t.profileGenderMale || "Male")
      : user?.gender === "female" ? (t.profileGenderFemale || "Female")
        : (t.profileGenderUnset || "Prefer not to say");

  return (
    <div className="page">
      <div className="grid-overlay" />
      <TopNav />

      <main className="main dash-main" style={{ maxWidth: 640 }}>
        <div className="dash-head">
          <div className="dash-head-left">
            <h1 className="dash-h1">{t.profileTitle || "Profile"}</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 13.5, margin: "4px 0 0" }}>
              {t.profileReadOnlyNote || "Your account information — for display only."}
            </p>
          </div>
        </div>

        {/* Summary card */}
        <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "var(--accent-dim)", color: "var(--accent-text)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 24, fontFamily: "var(--font-display)",
            flexShrink: 0, overflow: "hidden", border: "2px solid var(--border-light)",
          }}>
            {user?.avatarBase64
              ? <img src={user.avatarBase64} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (user?.name || "?").charAt(0).toUpperCase()
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="stat-card-value" style={{ fontSize: 18 }}>{user?.name}</div>
            <div className="stat-card-sub" style={{ wordBreak: "break-all" }}>{user?.email}</div>
            <div className="stat-card-sub" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <ZapIcon size={12} />
              {user?.plan === "premium" ? (t.planPremium || "Premium plan") : (t.planFree || "Free plan")}
            </div>
          </div>
        </div>

        {/* ── Account details (read-only) ── */}
        <div className="stat-card" style={{ display: "flex", flexDirection: "column", marginBottom: 20 }}>
          <div className="stat-card-label" style={{ marginBottom: 4 }}>
            {t.profileEditTitle || "Account details"}
          </div>

          <InfoRow
            icon={<UserIcon size={15} />}
            label={t.profileNameLabel || "Name"}
            value={user?.name || "—"}
          />

          <InfoRow
            icon={<MailIcon size={15} />}
            label={t.profileEmailLabel || "Email"}
            value={user?.email || "—"}
            trailing={
              <VerifiedPill
                verified={user?.emailVerified}
                verifiedLabel={t.profileVerified || "Verified"}
                unverifiedLabel={t.profileNotVerified || "Not verified"}
              />
            }
          />

          <InfoRow
            icon={<GlobeIcon size={15} />}
            label={t.profilePhoneLabel || "Phone number"}
            value={user?.phone || (t.profileNoPhoneYet || "No phone number yet")}
            trailing={
              user?.phone ? (
                <VerifiedPill
                  verified={user?.phoneVerified}
                  verifiedLabel={t.profileVerified || "Verified"}
                  unverifiedLabel={t.profileNotVerified || "Not verified"}
                />
              ) : null
            }
          />

          <InfoRow
            icon={<UserIcon size={15} />}
            label={t.profileGenderLabel || "Gender"}
            value={genderLabel}
          />

          <InfoRow
            icon={<CalendarIcon size={15} />}
            label={t.profileAgeLabel || "Age"}
            value={user?.age !== undefined && user?.age !== null && user?.age !== "" ? user.age : (t.profileAgeUnset || "Not set")}
          />

          {user?.country && (
            <InfoRow
              icon={<GlobeIcon size={15} />}
              label={t.profileCountryLabel || "Country"}
              value={user.country}
            />
          )}

          {joined && (
            <div style={{ paddingTop: 14 }}>
              <div style={{
                fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)",
                letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 3,
              }}>
                {t.profileJoined || "Member since"}
              </div>
              <div style={{ fontSize: 14.5, color: "var(--text)" }}>{joined}</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" className="nav-btn" onClick={handleLogout}>
            {t.navLogout}
          </button>
        </div>
      </main>

      <Footer onOpenCookiePrefs={openPreferences} />
    </div>
  );
}
