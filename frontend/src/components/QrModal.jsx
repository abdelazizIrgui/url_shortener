import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import { useLang } from "../context/LangContext.jsx";
import { ENDPOINTS } from "../config.js";
import { apiFetch } from "../api.js";

export default function QrModal({ linkId, onClose }) {
  const { t } = useLang();
  const [qr, setQr] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch(ENDPOINTS.linkQrCode(linkId))
      .then((data) => {
        if (active) setQr(data);
      })
      .catch((err) => {
        if (active) setError(err.message || t.errorFallback);
      });
    return () => {
      active = false;
    };
  }, [linkId]);

  const handleDownload = () => {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr.qrCode;
    a.download = "qrcode.png";
    a.click();
  };

  return (
    <Modal title={t.qrTitle} onClose={onClose}>
      {error && <div className="error-box">{error}</div>}
      {!qr && !error && <p className="stats-empty">{t.qrLoading}</p>}

      {qr && (
        <div className="qr-body">
          <img src={qr.qrCode} alt="QR Code" className="qr-image" />
          <code className="qr-url" dir="ltr">
            {qr.shortUrl}
          </code>
          <div className="modal-actions">
            <button type="button" className="copy-btn" onClick={onClose}>
              {t.qrClose}
            </button>
            <button type="button" className="submit-btn" onClick={handleDownload}>
              {t.qrDownload}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
