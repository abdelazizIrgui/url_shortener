import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav.jsx";
import Footer from "../components/Footer.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import AdminStatDetailModal from "../components/AdminStatDetailModal.jsx";
import Pagination from "../components/Pagination.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCookieConsent } from "../context/CookieConsentContext.jsx";
import { useDocumentMeta } from "../utils/useDocumentMeta.js";
import { ENDPOINTS } from "../config.js";
import { apiFetch } from "../api.js";
import {
  UserIcon, LinkIcon, MousePointerIcon, ZapIcon, ActivityIcon,
  FolderIcon, ShieldIcon, TrashIcon,
} from "../components/Shared.jsx";

function StatCard({ label, value, sub, icon, colorClass, onClick }) {
  return (
    <button
      type="button"
      className="stat-card"
      onClick={onClick}
      style={{ cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit" }}
    >
      <div className="stat-card-info">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {sub && <div className="stat-card-sub">{sub}</div>}
      </div>
      <div className={`stat-card-icon ${colorClass}`}>{icon}</div>
    </button>
  );
}

export default function AdminDashboardPage() {
  const { t } = useLang();
  const { user: currentUser } = useAuth();
  const { openPreferences } = useCookieConsent();

  useDocumentMeta({ title: `${t.adminDashboardTitle || "Admin dashboard"} — Admin`, noindex: true });

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsersFound, setTotalUsersFound] = useState(0);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statDetail, setStatDetail] = useState(null); // "users" | "premium" | "admins" | "links" | "clicks" | "campaigns"

  const loadStats = useCallback(() => {
    setStatsLoading(true);
    apiFetch(ENDPOINTS.adminStats)
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  const loadUsers = useCallback((opts = {}) => {
    const {
      q = search, role = roleFilter, plan = planFilter, sortBy = sort, pageNum = page,
    } = opts;
    setUsersLoading(true);
    const params = new URLSearchParams({ limit: "20", page: String(pageNum), sort: sortBy });
    if (q.trim()) params.set("search", q.trim());
    if (role) params.set("role", role);
    if (plan) params.set("plan", plan);
    apiFetch(ENDPOINTS.adminUsers(`?${params.toString()}`))
      .then((data) => {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalUsersFound(data.total || 0);
      })
      .catch((err) => setError(err.message || t.errorFallback))
      .finally(() => setUsersLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.errorFallback]);

  useEffect(() => { loadStats(); loadUsers({ pageNum: 1 }); }, [loadStats]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search-as-you-type; any filter/sort change also resets to page 1.
  useEffect(() => {
    const id = setTimeout(() => { setPage(1); loadUsers({ pageNum: 1 }); }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, planFilter, sort]);

  const goToPage = (p) => { setPage(p); loadUsers({ pageNum: p }); };

  const handleToggleStatus = async (u) => {
    setError("");
    setBusyId(u.id);
    const nextStatus = u.status === "suspended" ? "active" : "suspended";
    try {
      const data = await apiFetch(ENDPOINTS.adminUserStatus(u.id), {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: data.user.status } : x)));
    } catch (err) {
      setError(err.message || t.errorFallback);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleRole = async (u) => {
    setError("");
    setBusyId(u.id);
    const nextRole = u.role === "admin" ? "user" : "admin";
    try {
      const data = await apiFetch(ENDPOINTS.adminUserRole(u.id), {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: data.user.role } : x)));
      loadStats(); // "Admins" count on the stat card needs to reflect this immediately
    } catch (err) {
      setError(err.message || t.errorFallback);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiFetch(ENDPOINTS.adminUser(toDelete.id), { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== toDelete.id));
      setToDelete(null);
      loadStats();
    } catch (err) {
      setError(err.message || t.errorFallback);
    } finally {
      setDeleting(false);
    }
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

  return (
    <div className="page">
      <div className="grid-overlay" />
      <TopNav />

      <main className="main dash-main">
        <div className="dash-head">
          <div className="dash-head-left">
            <h1 className="dash-h1">{t.adminDashboardTitle || "Admin dashboard"}</h1>
          </div>
        </div>

        {/* Sub-nav: overview/users (this page) vs blog posts */}
        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          <span className="pill pill-short" style={{ cursor: "default" }}>
            {t.adminTabOverview || "Overview"} / {t.adminTabUsers || "Users"}
          </span>
          <Link to="/admin/posts" className="pill pill-original" style={{ textDecoration: "none" }}>
            {t.adminTabPosts || "Blog posts"}
          </Link>
        </div>

        {/* ── Platform stats ── */}
        <div className="stat-cards" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <StatCard
            label={t.adminStatTotalUsers || "Total users"}
            value={statsLoading ? "—" : (stats?.totalUsers ?? 0).toLocaleString()}
            sub={`${t.adminStatNewUsers7d || "New users (7 days)"}: ${statsLoading ? "—" : (stats?.newUsers7d ?? 0)}`}
            icon={<UserIcon size={18} />}
            colorClass="stat-icon-purple"
            onClick={() => setStatDetail("users")}
          />
          <StatCard
            label={t.adminStatTotalLinks || "Total links"}
            value={statsLoading ? "—" : (stats?.totalLinks ?? 0).toLocaleString()}
            icon={<LinkIcon size={18} />}
            colorClass="stat-icon-teal"
            onClick={() => setStatDetail("links")}
          />
          <StatCard
            label={t.adminStatTotalClicks || "Total clicks"}
            value={statsLoading ? "—" : (stats?.totalClicks ?? 0).toLocaleString()}
            icon={<MousePointerIcon size={18} />}
            colorClass="stat-icon-gold"
            onClick={() => setStatDetail("clicks")}
          />
          <StatCard
            label={t.adminStatPremiumUsers || "Premium users"}
            value={statsLoading ? "—" : (stats?.premiumUsers ?? 0).toLocaleString()}
            icon={<ZapIcon size={18} />}
            colorClass="stat-icon-purple"
            onClick={() => setStatDetail("premium")}
          />
          <StatCard
            label={t.adminStatCampaigns || "Campaigns"}
            value={statsLoading ? "—" : (stats?.totalCampaigns ?? 0).toLocaleString()}
            icon={<FolderIcon size={18} />}
            colorClass="stat-icon-teal"
            onClick={() => setStatDetail("campaigns")}
          />
          <StatCard
            label={t.adminStatAdmins || "Admins"}
            value={statsLoading ? "—" : (stats?.totalAdmins ?? 0).toLocaleString()}
            icon={<ShieldIcon size={18} />}
            colorClass="stat-icon-gold"
            onClick={() => setStatDetail("admins")}
          />
        </div>

        {/* ── Users management ── */}
        <div className="links-section-head">
          <h2 className="links-section-title">
            <ActivityIcon size={14} />
            {t.adminTabUsers || "Users"}
          </h2>
          <span className="links-count-badge">{totalUsersFound}</span>
        </div>

        <div className="list-toolbar">
          <input
            type="text"
            className="plain-input list-toolbar-search"
            placeholder={t.adminUsersSearchPlaceholder || "Search by name or email…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="plain-input list-toolbar-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select className="plain-input list-toolbar-select" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
            <option value="">All plans</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
          <select className="plain-input list-toolbar-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="nameAsc">Name (A–Z)</option>
          </select>
        </div>

        {error && <div className="error-box" style={{ marginBottom: 16 }}>⚠ {error}</div>}

        {usersLoading ? (
          <div className="dash-empty"><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>{t.adminNoUsers || "No users found."}</p>
        ) : (
          <ul className="links-list">
            {users.map((u) => {
              const isSelf = currentUser?.id === u.id;
              const busy = busyId === u.id;
              return (
                <li key={u.id} className="link-card">
                  <div className="link-card-main">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span className="link-card-title" style={{ margin: 0 }}>{u.name}</span>
                      <span
                        className="pill"
                        style={{
                          background: u.role === "admin" ? "var(--gold-dim)" : "var(--surface-3)",
                          color: u.role === "admin" ? "var(--gold)" : "var(--muted)",
                        }}
                      >
                        {u.role === "admin" ? (t.adminUserRoleAdmin || "Admin") : (t.adminUserRoleUser || "User")}
                      </span>
                      <span
                        className="pill"
                        style={{
                          background: u.status === "suspended" ? "var(--warm-dim)" : "var(--accent-dim)",
                          color: u.status === "suspended" ? "var(--warm)" : "var(--accent-text)",
                        }}
                      >
                        {u.status === "suspended" ? (t.adminUserStatusSuspended || "Suspended") : (t.adminUserStatusActive || "Active")}
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
                      <span className="meta-chip">
                        <LinkIcon size={11} /> {u.linkCount} {t.adminUserLinksCount || "links"}
                      </span>
                      <span className="meta-chip">
                        {t.adminUserJoined || "Joined"} {fmtDate(u.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="link-card-actions" style={{ flexWrap: "wrap" }}>
                    {isSelf ? (
                      <span className="action-btn" style={{ opacity: 0.6, cursor: "default" }} title={t.adminCannotModifySelf}>
                        {t.adminCannotModifySelf || "You can't change your own account from here."}
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="action-btn action-btn-edit"
                          disabled={busy}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.status === "suspended" ? (t.adminUserActivate || "Activate") : (t.adminUserSuspend || "Suspend")}
                        </button>
                        <span className="action-divider" />
                        <button
                          type="button"
                          className="action-btn action-btn-edit"
                          disabled={busy}
                          onClick={() => handleToggleRole(u)}
                        >
                          {u.role === "admin" ? (t.adminUserRemoveAdmin || "Remove admin") : (t.adminUserMakeAdmin || "Make admin")}
                        </button>
                        <span className="action-divider" />
                        <button
                          type="button"
                          className="action-btn action-btn-delete"
                          title={t.adminUserDelete || "Delete user"}
                          onClick={() => setToDelete(u)}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={goToPage}
          totalLabel={`${totalUsersFound} user${totalUsersFound === 1 ? "" : "s"}`}
        />
      </main>

      {statDetail && (
        <AdminStatDetailModal kind={statDetail} onClose={() => setStatDetail(null)} />
      )}

      {toDelete && (
        <ConfirmModal
          title={t.adminUserDelete || "Delete user"}
          message={`${t.adminUserDeleteConfirm || "This permanently deletes the user and all their data."} (${toDelete.email})`}
          confirmLabel={t.dashDelete || "Delete"}
          cancelLabel={t.dashCancel || "Cancel"}
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setToDelete(null)}
        />
      )}

      <Footer onOpenCookiePrefs={openPreferences} />
    </div>
  );
}
