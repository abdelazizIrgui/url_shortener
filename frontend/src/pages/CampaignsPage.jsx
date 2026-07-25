import { useEffect, useMemo, useState } from "react";
import TopNav from "../components/TopNav.jsx";
import Footer from "../components/Footer.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import Pagination from "../components/Pagination.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useCookieConsent } from "../context/CookieConsentContext.jsx";
import { ENDPOINTS } from "../config.js";
import { apiFetch } from "../api.js";
import { useListControls } from "../utils/useListControls.js";
import { FolderIcon, PlusIcon, MousePointerIcon, LinkIcon, TrashIcon, AlertCircleIcon } from "../components/Shared.jsx";

const SORTERS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  nameAsc: (a, b) => a.name.localeCompare(b.name),
  linksDesc: (a, b) => (b.linksCount || 0) - (a.linksCount || 0),
  clicksDesc: (a, b) => (b.totalClicks || 0) - (a.totalClicks || 0),
};

export default function CampaignsPage() {
  const { t } = useLang();
  const { openPreferences } = useCookieConsent();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const searchFn = useMemo(() => (c, q) =>
    c.name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q), []);

  const {
    paged, total, page, totalPages, setPage, search, setSearch, sort, setSort,
  } = useListControls(campaigns, {
    searchFn,
    sorters: SORTERS,
    defaultSort: "newest",
    pageSize: 9,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch(ENDPOINTS.campaigns)
      .then((data) => setCampaigns(data.campaigns || []))
      .catch((err) => setError(err.message || t.errorFallback))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      await apiFetch(ENDPOINTS.campaigns, {
        method: "POST",
        body: JSON.stringify({ name, description: description || undefined }),
      });
      setName(""); setDescription("");
      load();
    } catch (err) {
      setCreateError(err.message || t.errorFallback);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiFetch(ENDPOINTS.campaign(toDelete.id), { method: "DELETE" });
      setCampaigns((prev) => prev.filter((c) => c.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      setError(err.message || t.errorFallback);
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
            <h1 className="dash-h1">{t.campaignsTitle || "Campaigns"}</h1>
            <p className="dash-welcome">{t.campaignsSub || "Group links together to track them as one effort."}</p>
          </div>
        </div>

        {/* Create form */}
        <form className="create-card" onSubmit={handleCreate}>
          <div className="create-card-head">
            <div className="create-card-icon"><PlusIcon size={16} /></div>
            <h2 className="create-title">{t.campaignsNewTitle || "New campaign"}</h2>
          </div>

          <div className="field-row">
            <label className="field">
              <div className="field-label-wrap">
                <span className="field-label-icon"><FolderIcon size={12} /></span>
                <span>{t.campaignsNameLabel || "Name"}</span>
              </div>
              <input
                type="text"
                className="plain-input"
                placeholder={t.campaignsNamePlaceholder || "e.g. Summer Sale 2026"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <div className="field-label-wrap">
                <span className="field-label-icon"><LinkIcon size={12} /></span>
                <span>{t.campaignsDescLabel || "Description (optional)"}</span>
              </div>
              <input
                type="text"
                className="plain-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>

          {createError && (
            <div className="error-box">
              <AlertCircleIcon size={14} />
              {createError}
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={creating}>
            <PlusIcon size={15} />
            {creating ? (t.saving || "Saving…") : (t.campaignsCreate || "Create campaign")}
          </button>
        </form>

        {/* List */}
        <div className="stat-card-label" style={{ margin: "24px 0 12px" }}>
          {t.campaignsListTitle || "Your campaigns"} <span className="links-count-badge" style={{ marginLeft: 8 }}>{total}{total !== campaigns.length ? ` / ${campaigns.length}` : ""}</span>
        </div>

        {error && <div className="error-box">{error}</div>}

        {!loading && campaigns.length > 0 && (
          <div className="list-toolbar">
            <input
              type="text"
              className="plain-input list-toolbar-search"
              placeholder="Search campaigns…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="plain-input list-toolbar-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="nameAsc">Name (A–Z)</option>
              <option value="linksDesc">Most links</option>
              <option value="clicksDesc">Most clicks</option>
            </select>
          </div>
        )}

        {loading ? (
          <p className="dash-welcome">{t.loading || "Loading…"}</p>
        ) : campaigns.length === 0 ? (
          <p className="dash-welcome">{t.campaignsEmpty || "No campaigns yet — create one above."}</p>
        ) : total === 0 ? (
          <p className="dash-welcome">No campaigns match your search.</p>
        ) : (
          <>
          <div className="stat-cards">
            {paged.map((c) => (
              <div key={c.id} className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="stat-card-value" style={{ fontSize: 17 }}>{c.name}</div>
                    {c.description && <div className="stat-card-sub">{c.description}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setToDelete(c)}
                    style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 4 }}
                    aria-label="delete"
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: 18, marginTop: 4 }}>
                  <div className="stat-card-sub" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <LinkIcon size={12} /> {c.linksCount} {t.campaignsLinks || "links"}
                  </div>
                  <div className="stat-card-sub" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <MousePointerIcon size={12} /> {c.totalClicks} {t.dashClicks || "clicks"}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} totalLabel={`${total} campaign${total === 1 ? "" : "s"}`} />
          </>
        )}
      </main>

      {toDelete && (
        <ConfirmModal
          title={t.campaignsDeleteTitle || "Delete campaign?"}
          message={`${t.campaignsDeleteMsg || "This campaign will be removed. Its links stay, just unassigned."} (${toDelete.name})`}
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
