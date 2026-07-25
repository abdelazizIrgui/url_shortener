import { useMemo, useState } from "react";
import { useLang } from "../context/LangContext.jsx";
import { ENDPOINTS } from "../config.js";
import { apiFetch } from "../api.js";
import { useListControls } from "../utils/useListControls.js";
import Pagination from "./Pagination.jsx";
import {
  CopyIcon, ChainIcon, BarChartIcon, QrIcon, EditIcon, TrashIcon,
  MousePointerIcon, CalendarIcon, ClockIcon, LinkIcon
} from "./Shared.jsx";
import EditLinkModal from "./EditLinkModal.jsx";
import StatsModal from "./StatsModal.jsx";
import QrModal from "./QrModal.jsx";
import ConfirmModal from "./ConfirmModal.jsx";

const SORTERS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  clicksDesc: (a, b) => (b.clicksCount || 0) - (a.clicksCount || 0),
  clicksAsc: (a, b) => (a.clicksCount || 0) - (b.clicksCount || 0),
  titleAsc: (a, b) => (a.title || a.url).localeCompare(b.title || b.url),
};

export default function LinksList({ links, onUpdated, onDeleted }) {
  const { t, lang } = useLang();
  const [copiedId, setCopiedId] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [statsLinkId, setStatsLinkId] = useState(null);
  const [qrLinkId, setQrLinkId] = useState(null);
  const [deletingLink, setDeletingLink] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const searchFn = useMemo(() => (link, q) =>
    (link.title || "").toLowerCase().includes(q) ||
    link.url.toLowerCase().includes(q) ||
    link.shortUrl.toLowerCase().includes(q), []);

  const filterFn = useMemo(() => (link, filters) => {
    if (filters.status === "active") return !link.isExpired;
    if (filters.status === "expired") return !!link.isExpired;
    return true;
  }, []);

  const {
    paged, total, page, totalPages, setPage,
    search, setSearch, sort, setSort, filters, setFilter,
  } = useListControls(links, {
    searchFn,
    filterFn,
    sorters: SORTERS,
    defaultSort: "newest",
    defaultFilters: { status: "all" },
    pageSize: 10,
  });

  const handleCopy = async (link) => {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch { /* ignore */ }
  };

  const confirmDelete = async () => {
    if (!deletingLink) return;
    setDeleteLoading(true);
    try {
      await apiFetch(ENDPOINTS.link(deletingLink.id), { method: "DELETE" });
      onDeleted(deletingLink.id);
      setDeletingLink(null);
    } catch { /* ignore */ } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(lang, { year: "numeric", month: "short", day: "numeric" });

  if (links.length === 0) {
    return (
      <div className="dash-empty">
        <div className="dash-empty-icon">
          <LinkIcon size={24} />
        </div>
        <strong style={{ color: "var(--text-secondary)", fontSize: "15px" }}>No links yet</strong>
        <span>{t.dashEmpty}</span>
      </div>
    );
  }

  return (
    <>
      <div className="links-section-head">
        <p className="links-section-title">
          <LinkIcon size={14} />
          Your links
        </p>
        <span className="links-count-badge">{total}{total !== links.length ? ` / ${links.length}` : ""}</span>
      </div>

      <div className="list-toolbar">
        <input
          type="text"
          className="plain-input list-toolbar-search"
          placeholder="Search by title or URL…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="plain-input list-toolbar-select"
          value={filters.status}
          onChange={(e) => setFilter("status", e.target.value)}
        >
          <option value="all">All links</option>
          <option value="active">Active only</option>
          <option value="expired">Expired only</option>
        </select>
        <select
          className="plain-input list-toolbar-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="clicksDesc">Most clicks</option>
          <option value="clicksAsc">Fewest clicks</option>
          <option value="titleAsc">Title (A–Z)</option>
        </select>
      </div>

      {total === 0 ? (
        <div className="dash-empty">
          <div className="dash-empty-icon">
            <LinkIcon size={24} />
          </div>
          <strong style={{ color: "var(--text-secondary)", fontSize: "15px" }}>No links match</strong>
          <span>Try a different search or filter.</span>
        </div>
      ) : (
      <ul className="links-list">
        {paged.map((link) => (
          <li key={link.id} className="link-card">
            <div className="link-card-main">
              {link.title && (
                <div className="link-card-title">
                  <span className="link-title-icon"><LinkIcon size={13} /></span>
                  {link.title}
                </div>
              )}
              <div className="link-row link-row-compact">
                <span className="pill pill-original" dir="ltr" title={link.url}>
                  {link.url.length > 42 ? link.url.slice(0, 41) + "…" : link.url}
                </span>
                <span className="connector">
                  <span className="dash" />
                  <ChainIcon size={14} />
                  <span className="dash" />
                </span>
                <a className="pill pill-short" dir="ltr" href={link.shortUrl} target="_blank" rel="noreferrer">
                  {link.shortUrl.replace(/^https?:\/\//, "")}
                </a>
              </div>

              <div className="link-meta">
                <span className="meta-chip meta-chip-clicks">
                  <span className="meta-chip-icon"><MousePointerIcon size={10} /></span>
                  {link.clicksCount} {t.dashClicks}
                </span>
                <span className="meta-chip">
                  <span className="meta-chip-icon"><CalendarIcon size={10} /></span>
                  {t.dashCreated}: {formatDate(link.createdAt)}
                </span>
                {link.expiresAt ? (
                  <span className={`meta-chip${link.isExpired ? " meta-chip-warn" : ""}`}>
                    <span className="meta-chip-icon"><ClockIcon size={10} /></span>
                    {link.isExpired ? t.dashExpired : `${t.dashExpires}: ${formatDate(link.expiresAt)}`}
                  </span>
                ) : (
                  <span className="meta-chip">
                    <span className="meta-chip-icon"><ClockIcon size={10} /></span>
                    {t.dashNeverExpires}
                  </span>
                )}
              </div>
            </div>

            <div className="link-card-actions">
              <button
                type="button"
                className="action-btn action-btn-copy"
                onClick={() => handleCopy(link)}
                title={t.copyIdle}
              >
                <CopyIcon size={14} />
                {copiedId === link.id ? "Copied!" : "Copy"}
              </button>

              <span className="action-divider" />

              <button type="button" className="action-btn action-btn-stats" onClick={() => setStatsLinkId(link.id)} title={t.dashStats}>
                <BarChartIcon size={14} />
                {t.dashStats}
              </button>
              <button type="button" className="action-btn action-btn-qr" onClick={() => setQrLinkId(link.id)} title={t.dashQr}>
                <QrIcon size={14} />
                {t.dashQr}
              </button>
              <button type="button" className="action-btn action-btn-edit" onClick={() => setEditingLink(link)} title={t.dashEdit}>
                <EditIcon size={14} />
                {t.dashEdit}
              </button>

              <span className="action-divider" />

              <button type="button" className="action-btn action-btn-delete" onClick={() => setDeletingLink(link)} title={t.dashDelete}>
                <TrashIcon size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={setPage}
        totalLabel={`Showing ${paged.length ? (page - 1) * 10 + 1 : 0}–${(page - 1) * 10 + paged.length} of ${total}`}
      />

      {editingLink && (
        <EditLinkModal link={editingLink} onClose={() => setEditingLink(null)} onUpdated={onUpdated} />
      )}
      {statsLinkId && <StatsModal linkId={statsLinkId} onClose={() => setStatsLinkId(null)} />}
      {qrLinkId && <QrModal linkId={qrLinkId} onClose={() => setQrLinkId(null)} />}
      {deletingLink && (
        <ConfirmModal
          title={t.dashDelete}
          message={t.dashConfirmDelete}
          confirmLabel={t.dashDelete}
          cancelLabel={t.dashCancel}
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onClose={() => setDeletingLink(null)}
        />
      )}
    </>
  );
}
