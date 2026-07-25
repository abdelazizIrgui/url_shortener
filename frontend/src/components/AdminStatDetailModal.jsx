import { useEffect, useState, useCallback } from "react";
import Modal from "./Modal.jsx";
import Pagination from "./Pagination.jsx";
import { useLang } from "../context/LangContext.jsx";
import { ENDPOINTS } from "../config.js";
import { apiFetch } from "../api.js";
import {
  UserIcon, LinkIcon, MousePointerIcon, ZapIcon, FolderIcon, ShieldIcon,
} from "./Shared.jsx";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

function Row({ children }) {
  return (
    <li className="link-card" style={{ padding: "18px 20px", alignItems: "flex-start" }}>
      <div className="link-card-main" style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
        {children}
      </div>
    </li>
  );
}

function Empty({ label }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)", fontSize: 13 }}>
      {label}
    </div>
  );
}

/* Each "kind" maps to an endpoint + how to render a single row. */
const KIND_CONFIG = {
  users: { endpointType: "users", roleFilter: "", planFilter: "" },
  premium: { endpointType: "users", roleFilter: "", planFilter: "premium" },
  admins: { endpointType: "users", roleFilter: "admin", planFilter: "" },
  links: { endpointType: "links", sort: "recent" },
  clicks: { endpointType: "links", sort: "clicks" },
  campaigns: { endpointType: "campaigns" },
};

export default function AdminStatDetailModal({ kind, onClose }) {
  const { t } = useLang();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const cfg = KIND_CONFIG[kind] || KIND_CONFIG.users;

  const load = useCallback((q = "", pageNum = 1) => {
    setLoading(true);
    setError("");
    let promise;
    if (cfg.endpointType === "users") {
      const params = new URLSearchParams({ limit: "15", page: String(pageNum) });
      if (q.trim()) params.set("search", q.trim());
      if (cfg.roleFilter) params.set("role", cfg.roleFilter);
      if (cfg.planFilter) params.set("plan", cfg.planFilter);
      promise = apiFetch(ENDPOINTS.adminUsers(`?${params.toString()}`));
    } else if (cfg.endpointType === "links") {
      const params = new URLSearchParams({ limit: "15", page: String(pageNum), sort: cfg.sort || "recent" });
      if (q.trim()) params.set("search", q.trim());
      promise = apiFetch(ENDPOINTS.adminLinks(`?${params.toString()}`)).then((d) => ({ ...d, users: d.links }));
    } else {
      const params = new URLSearchParams({ limit: "15", page: String(pageNum) });
      if (q.trim()) params.set("search", q.trim());
      promise = apiFetch(ENDPOINTS.adminCampaigns(`?${params.toString()}`)).then((d) => ({ ...d, users: d.campaigns }));
    }
    promise
      .then((data) => {
        const list = data.users || data.links || data.campaigns || [];
        setItems(list);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total ?? list.length);
      })
      .catch((err) => setError(err.message || t.errorFallback))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  useEffect(() => { load("", 1); }, [load]);
  useEffect(() => {
    const id = setTimeout(() => { setPage(1); load(search, 1); }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const goToPage = (p) => { setPage(p); load(search, p); };

  const META = {
    users: { title: t.adminStatTotalUsers || "Total users", icon: <UserIcon size={16} />, color: "purple" },
    premium: { title: t.adminStatPremiumUsers || "Premium users", icon: <ZapIcon size={16} />, color: "purple" },
    admins: { title: t.adminStatAdmins || "Admins", icon: <ShieldIcon size={16} />, color: "gold" },
    links: { title: t.adminStatTotalLinks || "Total links", icon: <LinkIcon size={16} />, color: "teal" },
    clicks: { title: t.adminStatTotalClicks || "Total clicks", icon: <MousePointerIcon size={16} />, color: "gold" },
    campaigns: { title: t.adminStatCampaigns || "Campaigns", icon: <FolderIcon size={16} />, color: "teal" },
  }[kind] || {};

  const iconBg = {
    purple: { background: "var(--gold-dim)", color: "var(--gold)" },
    teal: { background: "var(--teal-dim)", color: "var(--teal)" },
    gold: { background: "var(--gold-dim)", color: "var(--gold)" },
  }[META.color];

  return (
    <Modal title={META.title} onClose={onClose} icon={META.icon} iconStyle={iconBg}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          type="text"
          className="plain-input"
          placeholder={t.adminStatSearchPlaceholder || "Search…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {error && <div className="error-box">⚠ {error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}><div className="spinner" /></div>
        ) : !items || items.length === 0 ? (
          <Empty label={t.adminStatNoData || "Nothing here yet."} />
        ) : (
          <ul className="links-list" style={{ maxHeight: 420, overflowY: "auto", gap: 12 }}>
            {cfg.endpointType === "users" && items.map((u) => (
              <Row key={u.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span className="link-card-title" style={{ margin: 0 }}>{u.name}</span>
                  <span className="pill" style={{
                    background: u.role === "admin" ? "var(--gold-dim)" : "var(--surface-3)",
                    color: u.role === "admin" ? "var(--gold)" : "var(--muted)",
                  }}>
                    {u.role === "admin" ? (t.adminUserRoleAdmin || "Admin") : (t.adminUserRoleUser || "User")}
                  </span>
                  {u.plan === "premium" && (
                    <span className="pill" style={{ background: "var(--teal-dim)", color: "var(--teal)" }}>
                      {t.planPremium || "Premium plan"}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4, wordBreak: "break-all" }}>
                  {u.email}
                </div>
                <div className="link-meta">
                  <span className="meta-chip"><LinkIcon size={11} /> {u.linkCount} {t.adminUserLinksCount || "links"}</span>
                  <span className="meta-chip">{t.adminUserJoined || "Joined"} {fmtDate(u.createdAt)}</span>
                </div>
              </Row>
            ))}

            {cfg.endpointType === "links" && items.map((l) => (
              <Row key={l.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span className="link-card-title" style={{ margin: 0 }}>{l.title || l.shortUrl}</span>
                  <span className="pill" style={{ background: "var(--gold-dim)", color: "var(--gold)" }}>
                    <MousePointerIcon size={11} /> {l.clicksCount}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4, wordBreak: "break-all" }}>
                  {l.url}
                </div>
                <div className="link-meta">
                  <span className="meta-chip">{l.owner ? l.owner.name : (t.adminUnknownOwner || "Unknown owner")}</span>
                  <span className="meta-chip">{fmtDate(l.createdAt)}</span>
                </div>
              </Row>
            ))}

            {cfg.endpointType === "campaigns" && items.map((c) => (
              <Row key={c.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span className="link-card-title" style={{ margin: 0 }}>{c.name}</span>
                  <span className="pill" style={{ background: "var(--teal-dim)", color: "var(--teal)" }}>
                    <LinkIcon size={11} /> {c.linkCount}
                  </span>
                </div>
                {c.description && (
                  <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>{c.description}</div>
                )}
                <div className="link-meta">
                  <span className="meta-chip">{c.owner ? c.owner.name : (t.adminUnknownOwner || "Unknown owner")}</span>
                  <span className="meta-chip">{fmtDate(c.createdAt)}</span>
                </div>
              </Row>
            ))}
          </ul>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={goToPage} totalLabel={`${total} total`} />
      </div>
    </Modal>
  );
}
