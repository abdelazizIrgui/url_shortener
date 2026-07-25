import { useState, useEffect } from "react";
import Modal from "./Modal.jsx";
import { useLang } from "../context/LangContext.jsx";
import { ENDPOINTS } from "../config.js";
import { apiFetch } from "../api.js";
import { EditIcon, GlobeIcon, LinkIcon, CalendarIcon, FolderIcon, ShuffleIcon, TrashIcon, PlusIcon } from "./Shared.jsx";

const toLocalInputValue = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function EditLinkModal({ link, onClose, onUpdated }) {
  const { t } = useLang();
  const [url, setUrl] = useState(link.url);
  const [title, setTitle] = useState(link.title || "");
  const [expiresAt, setExpiresAt] = useState(toLocalInputValue(link.expiresAt));
  const [campaignId, setCampaignId] = useState(link.campaignId || "");
  const [campaigns, setCampaigns] = useState([]);
  const [variants, setVariants] = useState(
    (link.variants || []).map((v) => ({ url: v.url, weight: v.weight }))
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch(ENDPOINTS.campaigns).then((data) => setCampaigns(data.campaigns || [])).catch(() => {});
  }, []);

  const addVariant = () => setVariants((v) => [...v, { url: "", weight: 1 }]);
  const removeVariant = (i) => setVariants((v) => v.filter((_, idx) => idx !== i));
  const updateVariant = (i, field, value) =>
    setVariants((v) => v.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cleanVariants = variants.filter((v) => v.url.trim());
      const data = await apiFetch(ENDPOINTS.link(link.id), {
        method: "PUT",
        body: JSON.stringify({
          url,
          title,
          expiresAt: expiresAt || null,
          campaignId: campaignId || null,
          variants: cleanVariants,
        }),
      });
      onUpdated(data.link);
      onClose();
    } catch (err) {
      setError(err.message || t.errorFallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t.dashEditTitle}
      onClose={onClose}
      icon={<EditIcon size={16} />}
      iconStyle={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}
    >
      <form className="auth-form" onSubmit={handleSave}>
        <label className="field">
          <div className="field-label-wrap">
            <span className="field-label-icon"><GlobeIcon size={12} /></span>
            <span>{t.dashUrlLabel}</span>
          </div>
          <input type="text" className="plain-input" value={url} onChange={(e) => setUrl(e.target.value)} dir="ltr" required />
        </label>
        <label className="field">
          <div className="field-label-wrap">
            <span className="field-label-icon"><LinkIcon size={12} /></span>
            <span>{t.dashTitleLabel}</span>
          </div>
          <input type="text" className="plain-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field">
          <div className="field-label-wrap">
            <span className="field-label-icon"><CalendarIcon size={12} /></span>
            <span>{t.dashExpiryLabel}</span>
          </div>
          <input type="datetime-local" className="plain-input" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} dir="ltr" />
        </label>

        {campaigns.length > 0 && (
          <label className="field">
            <div className="field-label-wrap">
              <span className="field-label-icon"><FolderIcon size={12} /></span>
              <span>{t.dashCampaignLabel || "Campaign (optional)"}</span>
            </div>
            <select className="plain-input" value={campaignId || ""} onChange={(e) => setCampaignId(e.target.value)} dir="ltr">
              <option value="">{t.dashNoCampaign || "No campaign"}</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        )}

        {/* A/B testing variants */}
        <div className="field">
          <div className="field-label-wrap">
            <span className="field-label-icon"><ShuffleIcon size={12} /></span>
            <span>{t.dashAbTestLabel || "A/B testing variants (optional)"}</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 8px" }}>
            {t.dashAbTestHelp || "Visitors are randomly split across these destinations by weight. Leave empty to disable."}
          </p>

          {variants.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input
                type="text"
                className="plain-input"
                placeholder="https://destination-b.com"
                value={v.url}
                onChange={(e) => updateVariant(i, "url", e.target.value)}
                dir="ltr"
                style={{ flex: 3 }}
              />
              <input
                type="number"
                className="plain-input"
                min={1}
                value={v.weight}
                onChange={(e) => updateVariant(i, "weight", e.target.value)}
                dir="ltr"
                title={t.dashAbWeight || "Weight"}
                style={{ flex: 1, minWidth: 60 }}
              />
              <button
                type="button"
                onClick={() => removeVariant(i)}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 6, display: "flex" }}
                aria-label="remove"
              >
                <TrashIcon size={15} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addVariant}
            className="copy-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
          >
            <PlusIcon size={13} />
            {t.dashAddVariant || "Add variant"}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="copy-btn" onClick={onClose}>{t.dashCancel}</button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {t.dashSave}
          </button>
        </div>
      </form>
    </Modal>
  );
}
