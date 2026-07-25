import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav.jsx";
import Footer from "../components/Footer.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import Pagination from "../components/Pagination.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useCookieConsent } from "../context/CookieConsentContext.jsx";
import { useDocumentMeta } from "../utils/useDocumentMeta.js";
import { ENDPOINTS } from "../config.js";
import { apiFetch } from "../api.js";
import { useListControls } from "../utils/useListControls.js";
import { PlusIcon, EditIcon, TrashIcon } from "../components/Shared.jsx";

const SORTERS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  titleAsc: (a, b) => a.title.localeCompare(b.title),
};

export default function AdminPostsPage() {
  const { t } = useLang();
  const { openPreferences } = useCookieConsent();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const searchFn = useMemo(() => (post, q) =>
    post.title.toLowerCase().includes(q) || post.slug.toLowerCase().includes(q), []);

  const filterFn = useMemo(() => (post, filters) => {
    if (filters.status === "published") return post.status === "published";
    if (filters.status === "draft") return post.status === "draft";
    return true;
  }, []);

  const {
    paged, total, page, totalPages, setPage,
    search, setSearch, sort, setSort, filters, setFilter,
  } = useListControls(posts, {
    searchFn,
    filterFn,
    sorters: SORTERS,
    defaultSort: "newest",
    defaultFilters: { status: "all" },
    pageSize: 10,
  });

  useDocumentMeta({ title: `${t.adminPostsTitle} — Admin`, noindex: true });

  const load = () => {
    setLoading(true);
    apiFetch(ENDPOINTS.adminPosts)
      .then((data) => setPosts(data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiFetch(ENDPOINTS.adminPost(toDelete.id), { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== toDelete.id));
      setToDelete(null);
    } catch {
      // ConfirmModal stays open — user can retry
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      <div className="grid-overlay" />
      <TopNav />

      <main className="main dash-main">
        <div className="dash-head">
          <div className="dash-head-left">
            <h1 className="dash-h1">{t.adminPostsTitle}</h1>
          </div>
          <Link to="/admin/posts/new" className="submit-btn" style={{ textDecoration: "none" }}>
            <PlusIcon size={15} />
            {t.adminNewPost}
          </Link>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          <Link to="/admin" className="pill pill-original" style={{ textDecoration: "none" }}>
            {t.adminTabOverview || "Overview"} / {t.adminTabUsers || "Users"}
          </Link>
          <span className="pill pill-short" style={{ cursor: "default" }}>
            {t.adminTabPosts || "Blog posts"}
          </span>
        </div>

        {!loading && posts.length > 0 && (
          <div className="list-toolbar">
            <input
              type="text"
              className="plain-input list-toolbar-search"
              placeholder="Search by title or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="plain-input list-toolbar-select"
              value={filters.status}
              onChange={(e) => setFilter("status", e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              className="plain-input list-toolbar-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="titleAsc">Title (A–Z)</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="dash-empty"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>{t.adminNoPosts}</p>
        ) : total === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No posts match your search.</p>
        ) : (
          <>
          <ul className="links-list">
            {paged.map((post) => (
              <li key={post.id} className="link-card">
                <div className="link-card-main">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="link-card-title" style={{ margin: 0 }}>{post.title}</span>
                    <span
                      className="pill"
                      style={{
                        background: post.status === "published" ? "var(--accent-dim)" : "var(--surface-3)",
                        color: post.status === "published" ? "var(--accent-text)" : "var(--muted)",
                      }}
                    >
                      {post.status === "published" ? t.adminStatusPublished : t.adminStatusDraft}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>
                    /blog/{post.slug}
                  </div>
                </div>
                <div className="link-card-actions">
                  <Link to={`/admin/posts/${post.id}`} className="action-btn action-btn-edit">
                    <EditIcon size={14} />
                    {t.dashEdit || "Edit"}
                  </Link>
                  <span className="action-divider" />
                  <button type="button" className="action-btn action-btn-delete" onClick={() => setToDelete(post)} title={t.adminDeletePost}>
                    <TrashIcon size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} totalLabel={`${total} post${total === 1 ? "" : "s"}`} />
          </>
        )}
      </main>

      {toDelete && (
        <ConfirmModal
          title={t.adminDeletePost}
          message={`${t.adminDeleteConfirm} (${toDelete.title})`}
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
