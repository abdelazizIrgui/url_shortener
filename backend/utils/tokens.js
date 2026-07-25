const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const RefreshToken = require("../model/RefreshTokenModel");

// ─── Access token (short-lived JWT, sent as Bearer header) ───────────────────
const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.SECRET_KEY, {
    // ACCESS_TOKEN_DURATION is the new name; DURATION is kept for backward
    // compatibility with existing deployments/env files.
    expiresIn: process.env.ACCESS_TOKEN_DURATION || process.env.DURATION || "15m",
  });

// ─── Refresh token (opaque random string, only its hash is stored) ───────────
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);

const hashToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

const issueRefreshToken = async (userId) => {
  const raw = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ userId, tokenHash: hashToken(raw), expiresAt });
  return raw;
};

// Returns the RefreshToken doc if valid, otherwise null.
const findValidRefreshToken = async (rawToken) => {
  if (!rawToken) return null;
  const doc = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });
  if (!doc) return null;
  if (doc.revokedAt) return null;
  if (doc.expiresAt < new Date()) return null;
  return doc;
};

const revokeRefreshToken = async (rawToken) => {
  if (!rawToken) return;
  await RefreshToken.updateOne({ tokenHash: hashToken(rawToken) }, { revokedAt: new Date() });
};

// Used on password reset / suspension — kills every session for the user.
const revokeAllUserRefreshTokens = async (userId) => {
  await RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
};

module.exports = {
  signAccessToken,
  issueRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  hashToken,
};
