// Strips HTML/script markup out of free-text request fields before they're
// ever stored, so stored XSS isn't possible even if some future render
// path ever changes. This is defense-in-depth on top of the frontend's
// existing output-escaping story (React escapes all text by default, and
// the blog renderer in utils/markdown.jsx never touches innerHTML at all —
// see that file's comments).
const xss = require("xss");

// Fields that must be left untouched: passwords (must survive byte-for-byte
// to hash/compare correctly), base64 images/OAuth credentials (not
// HTML, and xss() could corrupt them), URLs (the destination the user is
// shortening — validated elsewhere, and stripping characters here could
// silently break a legitimate link), and blog post markdown source (the
// admin-only editor legitimately uses '<'/'>'-adjacent syntax in code
// blocks; it's safe as-is because the renderer never injects raw HTML).
const SKIP_KEYS = new Set([
  "password", "newPassword", "currentPassword", "confirmPassword",
  "avatarBase64", "coverBase64", "credential",
  "url", "content", "refreshToken", "token",
]);

const XSS_OPTIONS = {
  whiteList: {}, // no tags allowed through — these are plain-text fields
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
};

function sanitizeValue(value) {
  if (typeof value === "string") return xss(value, XSS_OPTIONS);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") return sanitizeObjectInPlace(value);
  return value;
}

function sanitizeObjectInPlace(obj) {
  for (const key of Object.keys(obj)) {
    if (SKIP_KEYS.has(key)) continue;
    obj[key] = sanitizeValue(obj[key]);
  }
  return obj;
}

// Only touches req.body — mutated in place, so it works the same way
// under Express 5 as under 4. (req.query isn't sanitized here because
// nothing in this API builds rendered output directly from query
// params; see mongoSanitize.middleware.js for the injection-focused
// query-string handling.)
const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === "object") sanitizeObjectInPlace(req.body);
  next();
};

module.exports = { sanitizeInput, sanitizeValue };
