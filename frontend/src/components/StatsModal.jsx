import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import { useLang } from "../context/LangContext.jsx";
import { ENDPOINTS } from "../config.js";
import { apiFetch } from "../api.js";
import { BarChartIcon, GlobeIcon, MousePointerIcon, LinkIcon, ActivityIcon } from "./Shared.jsx";

/* ─── Country flag helper ─────────────────────────────────────────────── */
/* Maps country names / codes to ISO 3166-1 alpha-2 codes for flag images.
   (Emoji flags render as bare letters like "MA" on systems without an
   emoji font that supports regional-indicator glyphs, so we use real
   flag images from flagcdn.com instead.) */
const COUNTRY_ISO = {
  "United States": "us", "US": "us",
  "United Kingdom": "gb", "UK": "gb", "GB": "gb",
  "Germany": "de", "DE": "de",
  "France": "fr", "FR": "fr",
  "Saudi Arabia": "sa", "SA": "sa",
  "Morocco": "ma", "MA": "ma",
  "Egypt": "eg", "EG": "eg",
  "UAE": "ae", "AE": "ae",
  "Canada": "ca", "CA": "ca",
  "Australia": "au", "AU": "au",
  "India": "in", "IN": "in",
  "Brazil": "br", "BR": "br",
  "Japan": "jp", "JP": "jp",
  "China": "cn", "CN": "cn",
  "Spain": "es", "ES": "es",
  "Italy": "it", "IT": "it",
  "Netherlands": "nl", "NL": "nl",
  "Russia": "ru", "RU": "ru",
  "Turkey": "tr", "TR": "tr",
  "Pakistan": "pk", "PK": "pk",
  "Algeria": "dz", "DZ": "dz",
  "Tunisia": "tn", "TN": "tn",
  "Iraq": "iq", "IQ": "iq",
  "Jordan": "jo", "JO": "jo",
  "Kuwait": "kw", "KW": "kw",
};
function getIso(name) {
  return COUNTRY_ISO[name] || COUNTRY_ISO[name?.split(" ")[0]] || null;
}
function CountryFlag({ name, size = 20 }) {
  const iso = getIso(name);
  const [failed, setFailed] = useState(false);
  if (!iso || failed) {
    return <GlobeIcon size={size * 0.8} />;
  }
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
      alt={name}
      width={size}
      height={Math.round(size * 0.75)}
      onError={() => setFailed(true)}
      style={{
        borderRadius: 3,
        objectFit: "cover",
        border: "1px solid var(--border)",
        display: "block",
      }}
    />
  );
}

/* ─── Device icons (inline SVG) ──────────────────────────────────────── */
function DeviceIcon({ name, size = 16 }) {
  const n = (name || "").toLowerCase();
  if (n.includes("mobile") || n.includes("phone")) return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
  if (n.includes("tablet")) return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
  /* desktop / other */
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

/* ─── Referrer icons ─────────────────────────────────────────────────── */
function ReferrerIcon({ name, size = 14 }) {
  const n = (name || "").toLowerCase();
  if (n.includes("google")) return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.2-1 2.2-2 2.8v2.3h3.2c1.9-1.7 3-4.2 3-6.9z" fill="#4285F4"/>
      <path d="M12 22c2.7 0 5-1 6.7-2.6l-3.2-2.4c-.9.6-2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.9v2.5C4.6 19.8 8 22 12 22z" fill="#34A853"/>
      <path d="M6.2 13.7c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.6H2.9C2.3 8.8 2 10.4 2 12s.3 3.2.9 4.4l3.3-2.7z" fill="#FBBC05"/>
      <path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.9 14.7 2 12 2 8 2 4.6 4.2 2.9 7.6l3.3 2.6C7 7.7 9.3 5.9 12 5.9z" fill="#EA4335"/>
    </svg>
  );
  if (n.includes("twitter") || n.includes("t.co")) return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#1DA1F2">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
    </svg>
  );
  if (n.includes("facebook") || n.includes("fb.")) return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#1877F2">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
  if (n.includes("linkedin")) return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#0A66C2">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
  if (n.includes("direct") || n === "") return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

/* ─── Donut Chart for devices ─────────────────────────────────────────── */
const DONUT_COLORS = ["#ffbe0b", "#00b8a0", "#e8890c", "#ef4d6b", "#ec4899"];
function DonutChart({ items }) {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (!total) return null;
  let cumulative = 0;
  const R = 40, cx = 50, cy = 50, stroke = 14;
  const circumference = 2 * Math.PI * R;
  const segments = items.map((item, idx) => {
    const pct = item.count / total;
    const dash = pct * circumference;
    const offset = circumference - cumulative * circumference;
    cumulative += pct;
    return { ...item, dash, offset, color: DONUT_COLORS[idx % DONUT_COLORS.length] };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        {segments.map((seg, i) => (
          <circle key={i} cx={cx} cy={cy} r={R}
            fill="none" stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={seg.offset}
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        ))}
        <text x="50" y="47" textAnchor="middle" fill="var(--text)" fontSize="13" fontWeight="700" fontFamily="var(--font-display)">{total}</text>
        <text x="50" y="59" textAnchor="middle" fill="var(--muted)" fontSize="7">clicks</text>
      </svg>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 7 }}>
        {segments.map((seg, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
            <DeviceIcon name={seg.name} size={13} />
            <span style={{ color: "var(--text)", fontWeight: 500 }}>{seg.name}</span>
            <span style={{ color: "var(--muted)", marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11 }}>
              {Math.round(seg.count / total * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Animated bar row ───────────────────────────────────────────────── */
function AnimatedBarRow({ item, max, index, color, prefix }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((item.count / max) * 100), 60 + index * 80);
    return () => clearTimeout(t);
  }, [item.count, max, index]);

  return (
    <li style={{
      display: "grid",
      gridTemplateColumns: "28px 1fr auto",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      borderRadius: "var(--radius-md)",
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      transition: "border-color 0.2s",
      cursor: "default",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-light)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, lineHeight: 1 }}>{prefix}</span>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text)" }}>{item.name}</span>
          <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{item.count}</span>
        </div>
        <div style={{ height: 4, background: "var(--surface-3)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${width}%`,
            background: color || "linear-gradient(90deg, var(--accent), var(--teal))",
            borderRadius: 999,
            transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
      </div>
    </li>
  );
}

/* ─── Sparkline for clicks over time ─────────────────────────────────── */
function Sparkline({ data }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 340, H = 60, pad = 4;
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((d.count / max) * (H - pad * 2));
    return `${x},${y}`;
  }).join(" ");
  const areaBottom = `${W - pad},${H - pad} ${pad},${H - pad}`;
  return (
    <div style={{ marginBottom: 4 }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-text)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent-text)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${pts} ${areaBottom}`} fill="url(#spark-grad)" />
        <polyline points={pts} fill="none" stroke="var(--accent-text)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => {
          const x = pad + (i / (data.length - 1)) * (W - pad * 2);
          const y = H - pad - ((d.count / max) * (H - pad * 2));
          return <circle key={i} cx={x} cy={y} r="3" fill="var(--accent-text)" />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "var(--muted)" }}>
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

/* ─── Tab button ─────────────────────────────────────────────────────── */
function Tab({ active, onClick, icon, label }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "7px 14px",
      borderRadius: "var(--radius-md)",
      border: "1px solid",
      borderColor: active ? "var(--accent)" : "var(--border)",
      background: active ? "var(--accent-dim)" : "transparent",
      color: active ? "var(--accent-text)" : "var(--text-secondary)",
      fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-body)",
      cursor: "pointer",
      transition: "all 0.15s",
      whiteSpace: "nowrap",
    }}>
      {icon}
      {label}
    </button>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────── */
function Empty({ label }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)", fontSize: 13 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
      {label}
    </div>
  );
}

/* ─── Main StatsModal ─────────────────────────────────────────────────── */
export default function StatsModal({ linkId, onClose }) {
  const { t } = useLang();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("countries");

  useEffect(() => {
    let active = true;
    const fetchStats = () => {
      apiFetch(ENDPOINTS.linkStats(linkId))
        .then((data) => { if (active) setStats(data); })
        .catch((err) => { if (active) setError(err.message || t.errorFallback); });
    };
    fetchStats();
    // Keep stats fresh while the modal is open — click events can come in
    // from other tabs/devices at any moment.
    const intervalId = setInterval(fetchStats, 15000);
    return () => { active = false; clearInterval(intervalId); };
  }, [linkId]);

  /* Demo data when backend returns empty — remove once real data flows */
  const demoStats = {
    totalClicks: 0,
    byCountry: [],
    byDevice: [],
    byReferrer: [],
    clicksOverTime: [],
  };
  const s = stats || demoStats;

  return (
    <Modal
      title={t.statsTitle || "Link Statistics"}
      onClose={onClose}
      icon={<BarChartIcon size={16} />}
      iconStyle={{ background: "var(--accent-dim)", color: "var(--accent-text)" }}
    >
      {error && <div className="error-box">{error}</div>}
      {!stats && !error && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 13 }}>
          <div style={{ marginBottom: 8, opacity: 0.5 }}>⏳</div>
          Loading…
        </div>
      )}

      {stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Total clicks hero ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            background: "var(--accent-dim)",
            border: "1px solid rgba(61,220,132,0.3)",
            borderRadius: "var(--radius-lg)", padding: "16px 20px",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "var(--radius-md)",
              background: "var(--accent)", color: "var(--on-accent)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <MousePointerIcon size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 700,
                color: "var(--accent-text)", letterSpacing: "-0.03em", lineHeight: 1,
              }}>{s.totalClicks.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>
                {t.statsTotalClicks || "Total Clicks"}
              </div>
            </div>
            {s.totalClicks > 0 && (
              <div style={{ color: "var(--success)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <ActivityIcon size={13} />
                Active
              </div>
            )}
          </div>

          {/* ── Sparkline ── */}
          {s.clicksOverTime && s.clicksOverTime.length > 1 && (
            <div style={{
              background: "var(--surface-2)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", padding: "14px 16px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Clicks over time
              </div>
              <Sparkline data={s.clicksOverTime} />
            </div>
          )}

          {/* ── Tabs ── */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tab active={tab === "countries"} onClick={() => setTab("countries")}
              icon={<GlobeIcon size={13} />} label={t.statsByCountry || "Countries"} />
            <Tab active={tab === "devices"} onClick={() => setTab("devices")}
              icon={<DeviceIcon name="desktop" size={13} />} label={t.statsByDevice || "Devices"} />
            <Tab active={tab === "referrers"} onClick={() => setTab("referrers")}
              icon={<LinkIcon size={13} />} label={t.statsByReferrer || "Referrers"} />
          </div>

          {/* ── Countries tab ── */}
          {tab === "countries" && (
            <div>
              {(!s.byCountry || s.byCountry.length === 0)
                ? <Empty label={t.statsNoData || "No data yet"} />
                : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {s.byCountry.map((item, i) => (
                      <AnimatedBarRow key={item.name} item={item}
                        max={Math.max(...s.byCountry.map(x => x.count))}
                        index={i}
                        color={`linear-gradient(90deg, var(--accent), var(--teal))`}
                        prefix={<CountryFlag name={item.name} />}
                      />
                    ))}
                  </ul>
                )
              }
            </div>
          )}

          {/* ── Devices tab ── */}
          {tab === "devices" && (
            <div>
              {(!s.byDevice || s.byDevice.length === 0)
                ? <Empty label={t.statsNoData || "No data yet"} />
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <DonutChart items={s.byDevice} />
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      {s.byDevice.map((item, i) => (
                        <AnimatedBarRow key={item.name} item={item}
                          max={Math.max(...s.byDevice.map(x => x.count))}
                          index={i}
                          color={`linear-gradient(90deg, ${DONUT_COLORS[i % DONUT_COLORS.length]}, ${DONUT_COLORS[(i + 1) % DONUT_COLORS.length]})`}
                          prefix={<DeviceIcon name={item.name} size={16} />}
                        />
                      ))}
                    </ul>
                  </div>
                )
              }
            </div>
          )}

          {/* ── Referrers tab ── */}
          {tab === "referrers" && (
            <div>
              {(!s.byReferrer || s.byReferrer.length === 0)
                ? <Empty label={t.statsNoData || "No data yet"} />
                : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {s.byReferrer.map((item, i) => (
                      <AnimatedBarRow key={item.name} item={item}
                        max={Math.max(...s.byReferrer.map(x => x.count))}
                        index={i}
                        color="linear-gradient(90deg, var(--gold), var(--warm))"
                        prefix={<ReferrerIcon name={item.name} size={16} />}
                      />
                    ))}
                  </ul>
                )
              }
            </div>
          )}

        </div>
      )}
    </Modal>
  );
}
