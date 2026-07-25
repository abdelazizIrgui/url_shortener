import { useState } from "react";
import { createPortal } from "react-dom";
import { useLang } from "../context/LangContext.jsx";
import { ENDPOINTS } from "../config.js";
import { AlertCircleIcon } from "./Shared.jsx";
import { useBodyScrollLock } from "../utils/useBodyScrollLock.js";

export default function ReportAbuseModal({ targetType, targetValue, onClose }) {
  const { t } = useLang();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  useBodyScrollLock();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(ENDPOINTS.report, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetValue, reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Something went wrong");
      }
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>
          {t.reportAbuseModalTitle}
        </h3>

        {done ? (
          <p style={{ color: "var(--accent-text)" }}>{t.reportAbuseSuccess}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>{t.reportAbuseReasonLabel}</span>
              <textarea
                className="plain-input"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={1000}
                required
                style={{ resize: "vertical", marginTop: 6 }}
              />
            </label>

            {error && (
              <div className="error-box">
                <AlertCircleIcon size={14} />
                {error}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: 12 }}>
              {loading ? "…" : t.reportAbuseSubmit}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
