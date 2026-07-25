import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../utils/useBodyScrollLock.js";

export default function Modal({ title, onClose, children, icon, iconStyle }) {
  useBodyScrollLock();

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-head-left">
            {icon && (
              <div className="modal-head-icon" style={iconStyle}>
                {icon}
              </div>
            )}
            <h3>{title}</h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
