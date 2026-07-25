import Modal from "./Modal.jsx";
import { AlertCircleIcon } from "./Shared.jsx";

/**
 * Professional, app-styled confirmation dialog — replaces the native
 * browser window.confirm() popup (the ugly "localhost says..." box).
 */
export default function ConfirmModal({
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  danger = true,
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      icon={<AlertCircleIcon size={16} />}
      iconStyle={{
        background: danger ? "var(--warm-dim)" : "var(--accent-dim)",
        color: danger ? "var(--warm)" : "var(--accent-text)",
      }}
    >
      <p className="confirm-message">{message}</p>

      <div className="modal-actions">
        <button type="button" className="copy-btn" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={danger ? "submit-btn danger-btn" : "submit-btn"}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
