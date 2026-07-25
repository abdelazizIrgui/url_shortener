import { useRef, useState } from "react";

/**
 * CoverPhotoUploader — wide banner image (3.5:1), same base64-in-browser
 * pattern as AvatarUploader but resized/cropped for a cover photo instead
 * of a circular avatar.
 *
 * Props:
 *   current  — current base64 data URL (or "")
 *   onChange — called with new base64 string when user picks a file
 */
export default function CoverPhotoUploader({ current, onChange }) {
  const inputRef = useRef(null);
  const [hover, setHover] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WebP…)");
      return;
    }
    if (file.size > 1_300_000) {
      setError("Image is too large — please use a photo under 1.3 MB");
      return;
    }
    setError("");

    // Resize/crop to a wide banner (max 1200×340) before converting to base64
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const TARGET_W = 1200;
      const TARGET_H = 340;
      const targetRatio = TARGET_W / TARGET_H;
      const srcRatio = img.width / img.height;

      // Crop the source image to the target aspect ratio first (center crop)
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (srcRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }

      const canvas = document.createElement("canvas");
      canvas.width = TARGET_W;
      canvas.height = TARGET_H;
      canvas.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H);

      const base64 = canvas.toDataURL("image/jpeg", 0.82);
      URL.revokeObjectURL(url);
      onChange(base64);
    };
    img.src = url;

    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        onClick={() => inputRef.current?.click()}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: "100%",
          aspectRatio: "3.5 / 1",
          borderRadius: "var(--radius-lg)",
          background: current ? "transparent" : "var(--accent-dim)",
          border: `2px dashed ${hover ? "var(--accent)" : "var(--border-light)"}`,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "border-color 0.15s",
        }}
      >
        {current ? (
          <img src={current} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "var(--muted)" }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.5" />
              <path d="M21 15l-5-5-9 9" />
            </svg>
            <span style={{ fontSize: 12.5 }}>Add a cover photo</span>
          </div>
        )}

        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          opacity: hover && current ? 1 : 0,
          transition: "opacity 0.15s",
        }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Change cover</span>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Recommended: wide photo, at least 1200×340</span>
        {current && (
          <button
            type="button"
            onClick={() => onChange("")}
            style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}
          >
            Remove cover
          </button>
        )}
      </div>

      {error && <p style={{ fontSize: 12, color: "var(--warm)", margin: 0 }}>{error}</p>}
    </div>
  );
}
