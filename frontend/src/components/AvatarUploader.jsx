import { useRef, useState } from "react";

/**
 * AvatarUploader
 * Props:
 *   current  — current base64 data URL (or "")
 *   onChange — called with new base64 string when user picks a file
 *   size     — circle diameter in px (default 80)
 */
export default function AvatarUploader({ current, onChange, size = 80 }) {
  const inputRef = useRef(null);
  const [hover, setHover] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Accept only images
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WebP…)");
      return;
    }
    // 750 KB hard limit before base64 encoding (base64 adds ~33%)
    if (file.size > 750_000) {
      setError("Image is too large — please use a photo under 750 KB");
      return;
    }
    setError("");

    // Resize to max 256×256 before converting to base64
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 256;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);

      const base64 = canvas.toDataURL("image/jpeg", 0.82);
      URL.revokeObjectURL(url);
      onChange(base64);
    };
    img.src = url;

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const initial = "";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div
        onClick={() => inputRef.current?.click()}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: size, height: size,
          borderRadius: "50%",
          background: "var(--accent-dim)",
          border: `2px solid ${hover ? "var(--accent)" : "var(--border-light)"}`,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "border-color 0.15s",
          flexShrink: 0,
        }}
      >
        {current ? (
          <img src={current} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <svg viewBox="0 0 24 24" width={size * 0.4} height={size * 0.4} fill="none" stroke="var(--accent-text)" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        )}

        {/* Hover overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 3,
          opacity: hover ? 1 : 0,
          transition: "opacity 0.15s",
        }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>Change</span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: "none" }}
      />

      {current && (
        <button
          type="button"
          onClick={() => onChange("")}
          style={{
            background: "none", border: "none",
            color: "var(--muted)", fontSize: 12,
            cursor: "pointer", padding: "2px 6px",
            fontFamily: "var(--font-body)",
          }}
        >
          Remove photo
        </button>
      )}

      {error && (
        <p style={{ fontSize: 12, color: "var(--warm)", margin: 0, textAlign: "center" }}>
          {error}
        </p>
      )}
    </div>
  );
}
