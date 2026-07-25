const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    phone: { type: String, default: "", trim: true },
    country: { type: String, default: "", trim: true },        // e.g. "Morocco"
    countryCode: { type: String, default: "", trim: true },    // dial code, e.g. "+212"
    gender: { type: String, enum: ["male", "female", ""], default: "" },
    age: { type: Number, default: null },
    googleId: { type: String, default: null },
    plan: { type: String, enum: ["free", "premium"], default: "free" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // Admin can suspend an account without deleting it — suspended users
    // cannot log in or refresh their session.
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    // Password reset — we store a hash of the token (never the raw token)
    // plus an expiry. `select: false` keeps these out of normal queries.
    resetPasswordTokenHash: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },

    // ── Email / phone verification ──────────────────────────────────────────
    // Changing either is a two-step process: the new value is staged in
    // `pendingEmail`/`pendingPhone` until the owner proves control of it by
    // entering the code that was sent to it. The live `email`/`phone` field
    // is only overwritten once verification succeeds.
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    pendingEmail: { type: String, default: "", select: false },
    pendingPhone: { type: String, default: "", select: false },
    pendingCountry: { type: String, default: "", select: false },
    pendingCountryCode: { type: String, default: "", select: false },
    emailVerifyCodeHash: { type: String, default: null, select: false },
    emailVerifyCodeExpires: { type: Date, default: null, select: false },
    emailVerifyAttempts: { type: Number, default: 0, select: false },
    phoneVerifyCodeHash: { type: String, default: null, select: false },
    phoneVerifyCodeExpires: { type: Date, default: null, select: false },
    phoneVerifyAttempts: { type: Number, default: 0, select: false },

    // Set automatically when an account creates an unusually large number of
    // links in a short window — surfaced for manual review, not an auto-ban.
    flagged: { type: Boolean, default: false },
    flaggedReason: { type: String, default: "" },
    // Base64 data URL — stored directly in MongoDB (suitable for profile photos up to ~1MB)
    avatarBase64: { type: String, default: "" },

    // ── Account-level brute-force lockout ───────────────────────────────────
    // Separate from the IP-based rate limiter on /login — that limiter
    // resets per IP, so an attacker spreading guesses across many
    // IPs/proxies could still brute-force one specific account without it.
    // This counter is keyed to the account itself instead. `select: false`
    // since it's operational state, not something any normal response
    // should return.
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
