import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ENDPOINTS } from "../config.js";
import { LinkIconGlyph, LINK_ICON_COLORS, getLinkIconKey } from "../utils/linkIcons.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useDocumentMeta } from "../utils/useDocumentMeta.js";
import ReportAbuseModal from "../components/ReportAbuseModal.jsx";

/* ── Theme definitions ─────────────────────────────────────────────────────── */
const THEMES = {
  default: {
    bg: "linear-gradient(135deg, #140c30 0%, #153d4c 55%, #16a085 100%)",
    card: "rgba(255,255,255,0.05)",
    cardBorder: "rgba(22,160,133,0.25)",
    cardHover: "rgba(22,160,133,0.18)",
    accent: "#2fd9b8",
    accentGlow: "rgba(22,160,133,0.35)",
    text: "#eaf6f2",
    sub: "rgba(234,246,242,0.5)",
    avatarBg: "rgba(22,160,133,0.22)",
    avatarBorder: "rgba(22,160,133,0.5)",
    pageCardBg: "rgba(16,11,32,0.55)",
    pageCardSolid: "rgb(16,11,32)",
    pageCardBorder: "rgba(22,160,133,0.35)",
  },
  sunset: {
    bg: "linear-gradient(135deg, #1a0a0f 0%, #2d1a0a 50%, #1a0f05 100%)",
    card: "rgba(255,255,255,0.05)",
    cardBorder: "rgba(255,122,89,0.25)",
    cardHover: "rgba(255,122,89,0.15)",
    accent: "#ff7a59",
    accentGlow: "rgba(255,122,89,0.3)",
    text: "#fbe9e7",
    sub: "rgba(251,233,231,0.5)",
    avatarBg: "rgba(255,122,89,0.2)",
    avatarBorder: "rgba(255,122,89,0.5)",
    pageCardBg: "rgba(22,11,12,0.55)",
    pageCardSolid: "rgb(22,11,12)",
    pageCardBorder: "rgba(255,122,89,0.35)",
  },
  ocean: {
    bg: "linear-gradient(135deg, #020d1a 0%, #061e30 50%, #041520 100%)",
    card: "rgba(255,255,255,0.05)",
    cardBorder: "rgba(46,203,233,0.2)",
    cardHover: "rgba(46,203,233,0.12)",
    accent: "#2ecbe9",
    accentGlow: "rgba(46,203,233,0.3)",
    text: "#e3f7ff",
    sub: "rgba(227,247,255,0.5)",
    avatarBg: "rgba(46,203,233,0.15)",
    avatarBorder: "rgba(46,203,233,0.5)",
    pageCardBg: "rgba(3,14,22,0.55)",
    pageCardSolid: "rgb(3,14,22)",
    pageCardBorder: "rgba(46,203,233,0.35)",
  },
  mono: {
    bg: "linear-gradient(135deg, #0a0a0a 0%, #141414 100%)",
    card: "rgba(255,255,255,0.06)",
    cardBorder: "rgba(255,255,255,0.12)",
    cardHover: "rgba(255,255,255,0.1)",
    accent: "#ffffff",
    accentGlow: "rgba(255,255,255,0.2)",
    text: "#f2f2f2",
    sub: "rgba(242,242,242,0.45)",
    avatarBg: "rgba(255,255,255,0.1)",
    avatarBorder: "rgba(255,255,255,0.3)",
    pageCardBg: "rgba(12,12,12,0.55)",
    pageCardSolid: "rgb(12,12,12)",
    pageCardBorder: "rgba(255,255,255,0.18)",
  },
};

/* ── Link card ─────────────────────────────────────────────────────────────── */
function LinkCard({ label, url, theme }) {
  const [hover, setHover] = useState(false);
  const t = THEMES[theme] || THEMES.default;
  const iconKey = getLinkIconKey(url, label);
  const brandColor = LINK_ICON_COLORS[iconKey] || t.accent;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 12,
        padding: "13px 18px",
        borderRadius: 16,
        background: hover ? t.cardHover : t.card,
        border: `1px solid ${hover ? t.accent + "60" : t.cardBorder}`,
        color: t.text,
        fontWeight: 600,
        fontSize: 15,
        textDecoration: "none",
        transition: "all 0.2s ease",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hover ? `0 8px 32px ${t.accentGlow}` : "none",
        backdropFilter: "blur(8px)",
        letterSpacing: "0.01em",
        cursor: "pointer",
      }}
    >
      <span style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `${brandColor}1f`,
        color: brandColor,
        boxShadow: hover ? `0 0 0 1px ${brandColor}40` : "none",
        transition: "box-shadow 0.2s ease",
      }}>
        <LinkIconGlyph url={url} label={label} style={{ display: "flex" }} />
      </span>
      {label}
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
        stroke={t.accent} strokeWidth="2" style={{ marginLeft: "auto", opacity: 0.7, flexShrink: 0 }}>
        <path d="M7 17L17 7M17 7H7M17 7v10" />
      </svg>
    </a>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
export default function PublicBioPage() {
  const { username } = useParams();
  const { t: lang } = useLang();
  const [page, setPage] = useState(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useDocumentMeta({
    title: page ? `${page.displayName || page.username} — LinkBlick Bio Link` : "Bio Link",
    description: page?.bio || `${username}'s links, all in one place.`,
    // Per our SEO review, user-generated bio pages default to noindex to avoid
    // flooding search results with low-quality/duplicate-looking pages at scale.
    // Flip this to false later if you want bio pages to be publicly discoverable.
    noindex: true,
  });

  useEffect(() => {
    fetch(ENDPOINTS.publicBioPage(username))
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Not found");
        setPage(data.bioPage);
      })
      .catch((err) => setError(err.message || "Page not found"))
      .finally(() => setLoaded(true));
  }, [username]);

  const t = THEMES[page?.theme] || THEMES.default;
  const pageUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(pageUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: "#140c30",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid rgba(22,160,133,0.2)",
          borderTopColor: "#2fd9b8",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#140c30", color: "#eaf6f2",
        fontFamily: "system-ui, sans-serif", gap: 12,
      }}>
        <span style={{ fontSize: 48 }}>🔍</span>
        <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Page not found</p>
        <p style={{ fontSize: 14, opacity: 0.5, margin: 0 }}>@{username} doesn't exist yet.</p>
      </div>
    );
  }

  const initial = (page.displayName || page.username || "?").trim().charAt(0).toUpperCase();

  return (
    <div style={{
      minHeight: "100vh",
      background: t.bg,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "60px 20px 80px",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Ambient background glow */}
      <div style={{
        position: "fixed",
        top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 600,
        background: `radial-gradient(circle, ${t.accentGlow} 0%, transparent 70%)`,
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Content wrapper */}
      <div style={{
        width: "100%", maxWidth: 480,
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>

        {/* ── The card: border + soft glow shadow, "best style" container ── */}
        <div style={{
          width: "100%",
          borderRadius: 28,
          border: `1px solid ${t.pageCardBorder}`,
          background: t.pageCardBg,
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          boxShadow: `0 30px 70px -25px ${t.accentGlow}, 0 0 0 1px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)`,
          padding: page.coverImageBase64 ? "0 26px 36px" : "44px 26px 36px",
          display: "flex", flexDirection: "column", alignItems: "center",
          overflow: "hidden",
        }}>

        {/* ── Cover / banner photo — avatar overlaps its bottom edge ── */}
        {page.coverImageBase64 && (
          <div style={{
            width: "calc(100% + 52px)",
            margin: "0 -26px",
            height: 160,
            overflow: "hidden",
            position: "relative",
            flexShrink: 0,
          }}>
            <img
              src={page.coverImageBase64}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {/* The avatar below overlaps the last 40px of this cover (via its
                negative margin) — most of the avatar sits in the card body,
                clearly in front, with only its top edge dipping into the
                cover like a typical profile layout. Its square bounding box
                has transparent corners a circle doesn't fill, so something
                opaque needs to sit behind just that zone, or cover art
                bleeds through them. A circle matching the avatar+ring's own
                footprint (130px: 112 avatar + 3px border + 6px ring on each
                side) sits fully behind it with no flat edges peeking out
                around the ring, and leaves the rest of the cover untouched.
                The cover's overflow:hidden clips the part of this circle
                that falls outside its 160px height. */}
            <div style={{
              position: "absolute", top: 111, left: "50%", transform: "translateX(-50%)",
              width: 130, height: 130, borderRadius: "50%",
              background: t.pageCardSolid,
            }} />
          </div>
        )}

        {/* ── Avatar ── */}
        <div style={{
          width: 112, height: 112, borderRadius: "50%",
          background: t.avatarBg,
          border: `3px solid ${t.avatarBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, fontWeight: 800, color: t.accent,
          overflow: "hidden",
          marginTop: page.coverImageBase64 ? -40 : 0,
          marginBottom: 18,
          boxShadow: page.coverImageBase64
            ? `0 0 0 6px ${t.pageCardSolid}` // opaque ring — a translucent one would still show a faint blend of the cover behind it
            : `0 0 40px ${t.accentGlow}, 0 0 0 6px ${t.accentGlow}30`,
          flexShrink: 0,
          position: "relative",
          zIndex: 2,
        }}>
          {page.avatarBase64
            ? <img src={page.avatarBase64} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initial
          }
        </div>

        {/* ── Name ── */}
        <h1 style={{
          fontSize: 24, fontWeight: 800, margin: "0 0 4px",
          color: t.text, letterSpacing: "-0.02em", textAlign: "center",
        }}>
          {page.displayName || page.username}
        </h1>

        {/* ── @username ── */}
        <p style={{
          fontSize: 13, margin: "0 0 12px", color: t.sub,
          letterSpacing: "0.02em",
        }}>
          @{page.username}
        </p>

        {/* ── Bio ── */}
        {page.bio && (
          <p style={{
            fontSize: 14.5, color: t.sub,
            textAlign: "center", maxWidth: 360,
            margin: "0 0 32px", lineHeight: 1.65,
          }}>
            {page.bio}
          </p>
        )}
        {!page.bio && <div style={{ marginBottom: 32 }} />}

        {/* ── Links ── */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          {page.links.map((l) => (
            <LinkCard key={l.id} label={l.label} url={l.url} theme={page.theme} />
          ))}
          {page.links.length === 0 && (
            <p style={{ textAlign: "center", color: t.sub, fontSize: 14, padding: "24px 0" }}>
              No links yet.
            </p>
          )}
        </div>

        {/* ── Copy link banner ── */}
        <div style={{
          marginTop: 40, width: "100%",
          background: t.card,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 16,
          backdropFilter: "blur(8px)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "10px 16px",
            borderBottom: `1px solid ${t.cardBorder}`,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            color: t.sub, textTransform: "uppercase",
          }}>
            Share this page
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 0,
          }}>
            <span style={{
              flex: 1, padding: "13px 16px",
              fontSize: 13, color: t.text,
              fontFamily: "'Courier New', monospace",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              opacity: 0.8,
            }}>
              {pageUrl}
            </span>
            <button
              onClick={handleCopy}
              style={{
                flexShrink: 0,
                padding: "13px 20px",
                background: copied ? "rgba(46,204,113,0.15)" : `${t.accent}20`,
                border: "none",
                borderLeft: `1px solid ${t.cardBorder}`,
                color: copied ? "#2ecc71" : t.accent,
                fontWeight: 700, fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 7,
                whiteSpace: "nowrap",
              }}
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy link
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Share buttons ── */}
        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            {
              label: "WhatsApp",
              color: "#25D366",
              href: `https://wa.me/?text=${encodeURIComponent(pageUrl)}`,
              icon: (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
              ),
            },
            {
              label: "Twitter / X",
              color: "#1DA1F2",
              href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}`,
              icon: (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                </svg>
              ),
            },
            {
              label: "Telegram",
              color: "#0088cc",
              href: `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}`,
              icon: (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              ),
            },
          ].map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 16px",
                background: `${s.color}15`,
                border: `1px solid ${s.color}30`,
                borderRadius: 10,
                color: s.color,
                fontSize: 13, fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${s.color}25`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${s.color}15`; }}
            >
              {s.icon}
              {s.label}
            </a>
          ))}
        </div>

        </div>
        {/* ── end of card ── */}

        {/* ── Powered by footer ── */}
        <p style={{
          marginTop: 24, fontSize: 12,
          color: t.sub, opacity: 0.5, letterSpacing: "0.03em",
        }}>
          Built with LinkBlick
        </p>

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            marginTop: 6, fontSize: 11.5, color: t.sub, opacity: 0.4,
            textDecoration: "underline", fontFamily: "inherit",
          }}
        >
          {lang.reportAbuseLink}
        </button>

        {reportOpen && (
          <ReportAbuseModal
            targetType="bioPage"
            targetValue={username}
            onClose={() => setReportOpen(false)}
          />
        )}

      </div>
    </div>
  );
}
