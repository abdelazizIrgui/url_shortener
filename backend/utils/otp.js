const crypto = require("crypto");

// 6-digit numeric code, e.g. "042917"
const generateCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

// Same hashing approach as refresh tokens — never store the raw code.
const hashCode = (raw) => crypto.createHash("sha256").update(String(raw)).digest("hex");

module.exports = { generateCode, hashCode };
