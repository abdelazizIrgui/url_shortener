import { useState, useEffect } from "react";
import { useLang } from "../context/LangContext.jsx";
import { ENDPOINTS } from "../config.js";
import { apiFetch } from "../api.js";
import { PlusIcon, LinkIcon, GlobeIcon, CalendarIcon, AlertCircleIcon, FolderIcon } from "./Shared.jsx";

export default function LinkForm({ onCreated }) {
  const { t } = useLang();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(ENDPOINTS.campaigns).then((data) => setCampaigns(data.campaigns || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(ENDPOINTS.links, {
        method: "POST",
        body: JSON.stringify({
          url,
          title: title || undefined,
          expiresAt: expiresAt || undefined,
          campaignId: campaignId || undefined,
        }),
      });
      onCreated(data.link);
      setUrl(""); setTitle(""); setExpiresAt(""); setCampaignId("");
    } catch (err) {
      setError(err.message || t.errorFallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-card" onSubmit={handleSubmit}>
      <div className="create-card-head">
        <div className="create-card-icon">
          <PlusIcon size={16} />
        </div>
        <h2 className="create-title">{t.dashCreateTitle}</h2>
      </div>

      <label className="field">
        <div className="field-label-wrap">
          <span className="field-label-icon"><GlobeIcon size={12} /></span>
          <span>{t.dashUrlLabel}</span>
        </div>
        <input
          type="text"
          className="url-input plain-input"
          placeholder={t.placeholder}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          dir="ltr"
          required
        />
      </label>

      <div className="field-row">
        <label className="field">
          <div className="field-label-wrap">
            <span className="field-label-icon"><LinkIcon size={12} /></span>
            <span>{t.dashTitleLabel}</span>
          </div>
          <input
            type="text"
            className="plain-input"
            placeholder={t.dashTitlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="field">
          <div className="field-label-wrap">
            <span className="field-label-icon"><CalendarIcon size={12} /></span>
            <span>{t.dashExpiryLabel}</span>
          </div>
          <input
            type="datetime-local"
            className="plain-input"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            dir="ltr"
          />
        </label>
      </div>

      {campaigns.length > 0 && (
        <label className="field">
          <div className="field-label-wrap">
            <span className="field-label-icon"><FolderIcon size={12} /></span>
            <span>{t.dashCampaignLabel || "Campaign (optional)"}</span>
          </div>
          <select
            className="plain-input"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            dir="ltr"
          >
            <option value="">{t.dashNoCampaign || "No campaign"}</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      )}

      {error && (
        <div className="error-box">
          <AlertCircleIcon size={14} />
          {error}
        </div>
      )}

      <button type="submit" className="submit-btn" disabled={loading}>
        <PlusIcon size={15} />
        {loading ? t.dashCreating : t.dashCreateSubmit}
      </button>
    </form>
  );
}
