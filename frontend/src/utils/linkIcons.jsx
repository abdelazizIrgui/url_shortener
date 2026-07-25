// Detects the right platform icon for a Bio Link based on its URL (or label as fallback).
// Returns a small inline SVG (currentColor) — used in both the public bio page and editor.

const ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z"/>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.12-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.57A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.13C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.57a3 3 0 0 0 2.12-2.13A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8zM9.55 15.57V8.43L15.8 12l-6.25 3.57z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-3.05-3.61h-3.06v13.6a2.6 2.6 0 1 1-1.85-2.49V10.2a5.84 5.84 0 1 0 4.91 5.76V9.36a7.3 7.3 0 0 0 4.26 1.37V7.5a4.27 4.27 0 0 1-1.21-1.68z"/>
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z"/>
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.9.58.1.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.08 0 4.41-2.7 5.39-5.27 5.67.42.36.78 1.07.78 2.17v3.22c0 .3.2.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/>
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.78-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51-.17 0-.37 0-.57 0-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.8a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1 7.39-15.13c2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.15 1.59 5.95L0 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.17-1.24-6.16-3.48-8.41"/>
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M11.94 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.06 0zm4.96 7.22c.1 0 .32.02.47.14a.5.5 0 0 1 .17.33c.02.09.04.31.02.47-.18 1.9-.96 6.5-1.36 8.63-.17.9-.5 1.2-.82 1.23-.7.07-1.23-.46-1.9-.9-1.06-.7-1.65-1.13-2.68-1.8-1.18-.78-.42-1.21.26-1.91.18-.18 3.25-2.98 3.31-3.23 0-.03.01-.15-.06-.21s-.17-.04-.25-.02c-.1.02-1.79 1.14-5.06 3.35-.48.32-.91.49-1.3.48-.43-.01-1.25-.24-1.86-.44-.75-.24-1.35-.37-1.3-.79.03-.21.32-.43.9-.66 3.5-1.52 5.83-2.53 7-3.01 3.33-1.39 4.02-1.63 4.47-1.64z"/>
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  pinterest: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 0 0-4.2 22.2c-.05-.9-.1-2.27.02-3.25.1-.88.7-3.6 1.16-5.55l.15-.55s-.18-.43-.18-1.1c0-1.06.6-1.85 1.36-1.85.64 0 .95.48.95 1.06 0 .65-.41 1.61-.62 2.5-.18.74.37 1.34 1.1 1.34 1.32 0 2.34-1.4 2.34-3.41 0-1.78-1.28-3.03-3.1-3.03-2.12 0-3.36 1.59-3.36 3.23 0 .64.24 1.32.55 1.69a.45.45 0 0 1 .1.43c-.06.2-.18.64-.21.73-.04.13-.13.16-.3.1-1.1-.46-1.78-1.9-1.78-3.06 0-2.49 1.81-4.78 5.22-4.78 2.74 0 4.88 1.95 4.88 4.55 0 2.71-1.71 4.89-4.08 4.89-.8 0-1.55-.42-1.8-.9 0 0-.43 1.66-.53 2.06-.18.7-.69 1.6-1.03 2.13A11.5 11.5 0 1 0 12 .5z"/>
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.9-1.52l-.24.43c1.7.45 3.3 1.15 4.76 2.07a16.7 16.7 0 0 0-15.86 0 17.6 17.6 0 0 1 4.78-2.08l-.24-.43a19.8 19.8 0 0 0-4.91 1.53A20.36 20.36 0 0 0 .5 17.4a13.2 13.2 0 0 0 4.13 2.07s.5-.6.9-1.13a8.4 8.4 0 0 1-3.45-1.65c.29.21.77.5 1.1.68a16.6 16.6 0 0 0 14.6 0c.34-.18.8-.46 1.1-.68a8.4 8.4 0 0 1-3.46 1.65c.4.53.9 1.13.9 1.13a13.2 13.2 0 0 0 4.13-2.07 20.42 20.42 0 0 0-3.18-13.03zM8.55 14.7c-.94 0-1.7-.86-1.7-1.92s.75-1.92 1.7-1.92 1.71.87 1.7 1.92c0 1.06-.75 1.92-1.7 1.92zm6.9 0c-.94 0-1.7-.86-1.7-1.92s.75-1.92 1.7-1.92 1.71.87 1.7 1.92c0 1.06-.74 1.92-1.7 1.92z"/>
    </svg>
  ),
  spotify: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.5 17.3a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.56-1.15a.75.75 0 0 1-.33-1.46c4.58-1.04 8.5-.6 11.67 1.32.36.22.47.68.25 1.04zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.23-1.98-8.15-2.56-11.97-1.4a.94.94 0 0 1-.55-1.8c4.36-1.32 9.78-.68 13.5 1.6.44.27.58.85.31 1.29zm.13-3.4C15.6 8.42 9.5 8.2 6.04 9.27a1.13 1.13 0 0 1-.66-2.16c3.97-1.2 10.7-.95 14.93 1.59a1.13 1.13 0 0 1-1.2 1.93z"/>
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
};

// Domain/scheme → icon key. Checked in order against the URL.
const MATCHERS = [
  [/instagram\.com/i, "instagram"],
  [/(facebook\.com|fb\.com|fb\.me)/i, "facebook"],
  [/(twitter\.com|x\.com)/i, "twitter"],
  [/(youtube\.com|youtu\.be)/i, "youtube"],
  [/tiktok\.com/i, "tiktok"],
  [/linkedin\.com/i, "linkedin"],
  [/github\.com/i, "github"],
  [/(wa\.me|whatsapp\.com)/i, "whatsapp"],
  [/(t\.me|telegram\.me|telegram\.org)/i, "telegram"],
  [/pinterest\./i, "pinterest"],
  [/discord\.(gg|com)/i, "discord"],
  [/spotify\.com/i, "spotify"],
  [/^mailto:/i, "email"],
  [/^tel:/i, "phone"],
];

// Fallback: try to guess from the link's label text if the URL itself didn't match
// (handy for links typed without "https://" or custom shorteners)
const LABEL_HINTS = [
  [/insta/i, "instagram"],
  [/facebook|fb\b/i, "facebook"],
  [/twitter|\bx\b/i, "twitter"],
  [/youtube|yt\b/i, "youtube"],
  [/tiktok/i, "tiktok"],
  [/linkedin/i, "linkedin"],
  [/github/i, "github"],
  [/whatsapp/i, "whatsapp"],
  [/telegram/i, "telegram"],
  [/pinterest/i, "pinterest"],
  [/discord/i, "discord"],
  [/spotify/i, "spotify"],
  [/e-?mail/i, "email"],
  [/phone|call/i, "phone"],
];

export function getLinkIconKey(url = "", label = "") {
  for (const [regex, key] of MATCHERS) {
    if (regex.test(url)) return key;
  }
  for (const [regex, key] of LABEL_HINTS) {
    if (regex.test(label)) return key;
  }
  return "link";
}

export function LinkIconGlyph({ url, label, ...rest }) {
  const key = getLinkIconKey(url, label);
  return <span {...rest}>{ICONS[key]}</span>;
}

// Brand-ish accent colors per platform — used for the little icon badge background
export const LINK_ICON_COLORS = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  twitter: "#1DA1F2",
  youtube: "#FF0000",
  tiktok: "#25F4EE",
  linkedin: "#0A66C2",
  github: "#ffffff",
  whatsapp: "#25D366",
  telegram: "#0088cc",
  pinterest: "#E60023",
  discord: "#5865F2",
  spotify: "#1DB954",
  email: "#f59e0b",
  phone: "#10b981",
  link: null, // falls back to the page's theme accent color
};
