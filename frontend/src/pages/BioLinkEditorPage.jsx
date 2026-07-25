import { useEffect, useState, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import TopNav from "../components/TopNav.jsx";
import Footer from "../components/Footer.jsx";
import AvatarUploader from "../components/AvatarUploader.jsx";
import CoverPhotoUploader from "../components/CoverPhotoUploader.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCookieConsent } from "../context/CookieConsentContext.jsx";
import { ENDPOINTS } from "../config.js";
import { apiFetch } from "../api.js";
import { GlobeIcon, UserIcon, LinkIcon, PlusIcon, TrashIcon, AlertCircleIcon, ImageIcon } from "../components/Shared.jsx";

const THEMES = ["default", "sunset", "ocean", "mono"];

export default function BioLinkEditorPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { openPreferences } = useCookieConsent();

  const [loaded, setLoaded] = useState(false);
  const [username, setUsername] = useState("");         // READ-ONLY after first load
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [bio, setBio] = useState("");
  const [theme, setTheme] = useState("default");
  const [links, setLinks] = useState([]);
  const [avatar, setAvatar] = useState("");             // base64 avatar for bio page
  const [coverImage, setCoverImage] = useState("");      // base64 cover/banner image

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);

  const bioPageUrl = username
    ? `${window.location.origin}/${username}`
    : "";

  useEffect(() => {
    // Fetch both bio page and fresh user profile in parallel
    // so the avatar is always populated even on first visit
    Promise.all([
      apiFetch(ENDPOINTS.myBioPage),
      apiFetch(ENDPOINTS.me),
    ])
      .then(([bioData, meData]) => {
        const profileAvatar = meData?.user?.avatarBase64 || user?.avatarBase64 || "";

        if (bioData.bioPage) {
          setUsername(bioData.bioPage.username || "");
          setDisplayName(bioData.bioPage.displayName || meData?.user?.name || user?.name || "");
          setBio(bioData.bioPage.bio || "");
          setTheme(bioData.bioPage.theme || "default");
          // Use bio page avatar if set, otherwise fall back to profile avatar
          setAvatar(bioData.bioPage.avatarBase64 || profileAvatar);
          setCoverImage(bioData.bioPage.coverImageBase64 || "");
          setLinks((bioData.bioPage.links || []).map((l) => ({ label: l.label, url: l.url })));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const addLink = () => setLinks((v) => [...v, { label: "", url: "" }]);
  const removeLink = (i) => setLinks((v) => v.filter((_, idx) => idx !== i));
  const updateLink = (i, field, value) =>
    setLinks((v) => v.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const cleanLinks = links.filter((l) => l.label.trim() && l.url.trim());
      await apiFetch(ENDPOINTS.myBioPage, {
        method: "PUT",
        body: JSON.stringify({
          displayName,
          bio,
          theme,
          avatarBase64: avatar,
          coverImageBase64: coverImage,
          links: cleanLinks,
          isPublished: true,
        }),
        // Note: we do NOT send `username` — it's locked on the server after creation
      });
      setSuccess(t.profileSaved || "Saved successfully");
    } catch (err) {
      setError(err.code === "PAYLOAD_TOO_LARGE" ? t.errorPayloadTooLarge : (err.message || t.errorFallback));
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="page">
        <div className="grid-overlay" />
        <TopNav />
        <main className="main dash-main">
          <p className="dash-welcome">{t.loading || "Loading…"}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="grid-overlay" />
      <TopNav />

      <main className="main dash-main" style={{ maxWidth: 680 }}>
        <div className="dash-head">
          <div className="dash-head-left">
            <h1 className="dash-h1">{t.bioTitle || "Bio Link page"}</h1>
            <p className="dash-welcome">
              {t.bioSub || "A single public page with all your links — like a mini Linktree."}
            </p>
          </div>
        </div>

        <form className="create-card" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* ── Cover photo uploader ── */}
          <div className="field">
            <div className="field-label-wrap">
              <span className="field-label-icon"><ImageIcon size={12} /></span>
              <span>{t.profileCoverLabel || "Cover photo"}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <CoverPhotoUploader current={coverImage} onChange={setCoverImage} />
            </div>
          </div>

          {/* ── Avatar uploader ── */}
          <div className="field">
            <div className="field-label-wrap">
              <span className="field-label-icon"><UserIcon size={12} /></span>
              <span>{t.profileAvatarLabel || "Profile photo"}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <AvatarUploader current={avatar} onChange={setAvatar} size={80} />
            </div>
          </div>

          {/* ── Username — read-only, shown for info ── */}
          <div className="field">
            <div className="field-label-wrap">
              <span className="field-label-icon"><GlobeIcon size={12} /></span>
              <span>{t.bioUsernameLabel || "Your public URL"}</span>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", padding: "10px 13px",
              marginTop: 6,
            }}>
              <span style={{ color: "var(--muted)", fontSize: 13, whiteSpace: "nowrap" }}>
                {window.location.host}/
              </span>
              <span style={{
                color: "var(--accent-text)", fontSize: 13, fontWeight: 600,
                letterSpacing: "0.01em", fontFamily: "var(--font-body)",
              }}>
                {username}
              </span>
              <span style={{
                marginLeft: "auto", fontSize: 11, color: "var(--muted)",
                background: "var(--surface-2)", border: "1px solid var(--border)",
                borderRadius: 4, padding: "2px 7px",
              }}>
                permanent
              </span>
            </div>
          </div>

          {/* ── Display name ── */}
          <label className="field">
            <div className="field-label-wrap">
              <span className="field-label-icon"><UserIcon size={12} /></span>
              <span>{t.bioDisplayNameLabel || "Display name"}</span>
            </div>
            <input
              type="text"
              className="plain-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={60}
            />
          </label>

          {/* ── Bio ── */}
          <label className="field">
            <div className="field-label-wrap">
              <span className="field-label-icon"><LinkIcon size={12} /></span>
              <span>{t.bioBioLabel || "Short bio"}</span>
            </div>
            <textarea
              className="plain-input"
              rows={2}
              maxLength={280}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ resize: "vertical", fontFamily: "var(--font-body)" }}
            />
          </label>

          {/* ── Theme ── */}
          <label className="field">
            <div className="field-label-wrap">
              <span>{t.bioThemeLabel || "Theme"}</span>
            </div>
            <select
              className="plain-input"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              dir="ltr"
            >
              {THEMES.map((th) => <option key={th} value={th}>{th}</option>)}
            </select>
          </label>

          {/* ── Links ── */}
          <div className="field">
            <div className="field-label-wrap">
              <span>{t.bioLinksLabel || "Links"}</span>
            </div>
            {links.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  className="plain-input"
                  placeholder={t.bioLinkLabelPlaceholder || "Label, e.g. My Instagram"}
                  value={l.label}
                  onChange={(e) => updateLink(i, "label", e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  className="plain-input"
                  placeholder="https://..."
                  value={l.url}
                  onChange={(e) => updateLink(i, "url", e.target.value)}
                  dir="ltr"
                  style={{ flex: 2 }}
                />
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 6 }}
                  aria-label="remove"
                >
                  <TrashIcon size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLink}
              className="copy-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
            >
              <PlusIcon size={13} />
              {t.bioAddLink || "Add link"}
            </button>
          </div>

          {error && (
            <div className="error-box">
              <AlertCircleIcon size={14} />
              {error}
            </div>
          )}
          {success && (
            <div style={{
              display: "flex", alignItems: "center", gap: 9,
              background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.25)",
              borderRadius: "var(--radius-md)", padding: "10px 14px",
              color: "#2ecc71", fontSize: 13,
            }}>
              <span style={{ fontSize: 15 }}>✓</span>
              {success}
              {username && (
                <>
                  <RouterLink
                    to={`/${username}`}
                    target="_blank"
                    style={{ color: "var(--accent-text)", marginLeft: 6 }}
                  >
                    {t.bioViewLive || "View live page →"}
                  </RouterLink>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(bioPageUrl).then(() => {
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2500);
                      });
                    }}
                    title={copiedUrl ? "Copied!" : "Copy link"}
                    aria-label="Copy bio page link"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      padding: 4, marginLeft: 4,
                      display: "inline-flex", alignItems: "center",
                      color: copiedUrl ? "#2ecc71" : "var(--accent-text)",
                      transition: "color 0.2s",
                    }}
                  >
                    {copiedUrl ? (
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={saving}>
            {saving ? (t.saving || "Saving…") : (t.saveChanges || "Save changes")}
          </button>
        </form>
      </main>

      <Footer onOpenCookiePrefs={openPreferences} />
    </div>
  );
}
