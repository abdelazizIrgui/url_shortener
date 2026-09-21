const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../model/UserModel");
const {
  signAccessToken,
  issueRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  hashToken,
} = require("../utils/tokens");
const { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE, CSRF_COOKIE } = require("../utils/cookies");
const { issueCsrfCookie } = require("../middleware/csrf.middleware");
const { sendPasswordResetEmail, sendVerificationCodeEmail } = require("../utils/mailer");
const { sendVerificationSMS } = require("../utils/sms");
const { generateCode, hashCode } = require("../utils/otp");
const { isValidCountryDial } = require("../utils/countries");

const CODE_TTL_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  country: user.country || "",
  countryCode: user.countryCode || "",
  gender: user.gender || "",
  age: user.age ?? null,
  plan: user.plan,
  role: user.role || "user",
  status: user.status || "active",
  avatarBase64: user.avatarBase64 || "",
  emailVerified: !!user.emailVerified,
  phoneVerified: !!user.phoneVerified,
  // Surfaced so the UI can show "verifying newemail@x.com — enter the code we sent"
  pendingEmail: user.pendingEmail || "",
  pendingPhone: user.pendingPhone || "",
  pendingCountry: user.pendingCountry || "",
  pendingCountryCode: user.pendingCountryCode || "",
  createdAt: user.createdAt,
});

// ─── Validation helpers ─────────────────────────────────────────────────────
// Full name: letters (incl. accented) and spaces/hyphens/apostrophes only,
// at least 2 characters total.
const NAME_REGEX = /^[a-zA-ZÀ-ÖØ-öø-ÿ' -]{2,60}$/;
// Email: standard, pragmatic pattern (mongoose/HTML5 already checks shape too).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone: optional leading +, digits/spaces/dashes/parens, 8–20 chars.
const PHONE_REGEX = /^\+?[0-9\s\-().]{8,20}$/;

const validateRegisterInput = ({ name, email, password, phone, gender, age, country, countryCode }) => {
  if (!name || !name.trim()) return "Name is required";
  if (!NAME_REGEX.test(name.trim()))
    return "Name must contain only letters and be at least 2 characters";

  if (!email || !email.trim()) return "Email is required";
  if (!EMAIL_REGEX.test(email.trim())) return "Please enter a valid email address";

  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";

  if (!country || !country.trim()) return "Please select your country";
  if (!countryCode || !isValidCountryDial(country.trim(), countryCode.trim()))
    return "Please select a valid country";

  if (!phone || !phone.trim()) return "Phone number is required";
  const phoneDigits = phone.replace(/[^0-9]/g, "");
  if (!PHONE_REGEX.test(phone.trim()) || phoneDigits.length < 8 || phoneDigits.length > 15)
    return "Please enter a valid phone number";
  if (!phone.trim().startsWith(countryCode.trim()))
    return `Phone number must start with ${countryCode.trim()} for the selected country`;

  if (!gender || !["male", "female"].includes(gender))
    return "Please select a gender";

  if (age === undefined || age === null || age === "")
    return "Age is required";
  const ageNum = Number(age);
  if (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 120)
    return "Please enter a valid age between 13 and 120";

  return null;
};

// Issues both tokens for a user, sets the refresh token as an httpOnly
// Secure cookie (plus a readable CSRF cookie for the double-submit check on
// /refresh and /logout), and returns the payload shape every login-style
// endpoint (register/login/google/refresh) responds with. The refresh
// token itself never appears in the JSON body — only the short-lived
// access token does, which the frontend keeps in memory/localStorage and
// sends explicitly via the Authorization header.
const issueSession = async (user, res) => {
  const token = signAccessToken(user._id);
  const refreshToken = await issueRefreshToken(user._id);
  setRefreshCookie(res, refreshToken);
  issueCsrfCookie(res);
  return { token, user: sanitizeUser(user) };
};

// ─── Register ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, phone, gender, age, avatarBase64, country, countryCode } = req.body;

    const validationError = validateRegisterInput({ name, email, password, phone, gender, age, country, countryCode });
    if (validationError) return res.status(400).json({ message: validationError });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    // Validate avatar size if provided (~750KB base64 limit)
    if (avatarBase64 && avatarBase64.length > 1_000_000)
      return res.status(400).json({ message: "Profile photo is too large (max ~750 KB)" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      phone: phone.trim(),
      country: country.trim(),
      countryCode: countryCode.trim(),
      gender,
      age: Number(age),
      avatarBase64: avatarBase64 || "",
    });

    return res.status(201).json(await issueSession(user, res));
  } catch (err) {
    console.error("[register]", err.message);
    return res.status(500).json({ message: "Error creating account" });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
// Account-level brute-force lockout (independent of the IP-based rate
// limiter in server.js — see the schema comment on failedLoginAttempts).
const MAX_FAILED_LOGIN_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
const LOGIN_LOCK_MS = Number(process.env.LOGIN_LOCK_MINUTES || 15) * 60 * 1000;

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string" || !email || !password)
      return res.status(400).json({ message: "email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() }).select("+failedLoginAttempts +lockUntil");
    if (!user || !user.password)
      return res.status(401).json({ message: "Invalid email or password" });

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        message: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
        code: "ACCOUNT_LOCKED",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOGIN_LOCK_MS);
        user.failedLoginAttempts = 0; // next window starts clean once unlocked
      }
      await user.save();
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Correct password — clear any prior failed-attempt state.
    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    if (user.status === "suspended")
      return res.status(403).json({ message: "Your account has been suspended. Contact support for help.", code: "ACCOUNT_SUSPENDED" });

    return res.status(200).json(await issueSession(user, res));
  } catch (err) {
    console.error("[login]", err.message);
    return res.status(500).json({ message: "Error logging in" });
  }
};

// ─── Get current user ────────────────────────────────────────────────────────
const me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "+pendingEmail +pendingPhone +pendingCountry +pendingCountryCode"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("[me]", err.message);
    return res.status(500).json({ message: "Error fetching user" });
  }
};

// ─── Update profile (name, avatar, gender, age — non-sensitive fields) ───────
// Email and phone are intentionally NOT accepted here — changing either
// goes through the verification flow below so we never silently trust an
// unverified contact detail.
const updateMe = async (req, res) => {
  try {
    const { name, avatarBase64, gender, age } = req.body;

    if (!name || !name.trim() || name.trim().length < 2)
      return res.status(400).json({ message: "Name must be at least 2 characters" });

    if (avatarBase64 !== undefined && avatarBase64 !== "" && avatarBase64.length > 1_000_000)
      return res.status(400).json({ message: "Profile photo is too large (max ~750 KB)" });

    if (gender !== undefined && gender !== "" && !["male", "female"].includes(gender))
      return res.status(400).json({ message: "Gender must be 'male' or 'female'" });

    if (age !== undefined && age !== null && age !== "") {
      const ageNum = Number(age);
      if (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 120)
        return res.status(400).json({ message: "Please enter a valid age between 13 and 120" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name.trim();
    if (avatarBase64 !== undefined) user.avatarBase64 = avatarBase64;
    if (gender !== undefined) user.gender = gender;
    if (age !== undefined && age !== "") user.age = Number(age);

    await user.save();
    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("[updateMe]", err.message);
    return res.status(500).json({ message: "Error updating profile" });
  }
};

// ─── Email change: step 1 — request a code ────────────────────────────────────
// Sends a 6-digit code to the NEW email address. The live `email` field is
// untouched until that code is confirmed, so a typo or someone else's inbox
// can never take over the account.
const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !EMAIL_REGEX.test(newEmail.trim()))
      return res.status(400).json({ message: "Please enter a valid email address" });

    const cleanEmail = newEmail.toLowerCase().trim();

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (cleanEmail !== user.email) {
      const taken = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
      if (taken) return res.status(409).json({ message: "That email is already in use" });
    }

    const code = generateCode();
    user.pendingEmail = cleanEmail;
    user.emailVerifyCodeHash = hashCode(code);
    user.emailVerifyCodeExpires = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
    user.emailVerifyAttempts = 0;
    await user.save();

    sendVerificationCodeEmail(cleanEmail, code).catch(() => {});

    return res.status(200).json({ message: `Verification code sent to ${cleanEmail}` });
  } catch (err) {
    console.error("[requestEmailChange]", err.message);
    return res.status(500).json({ message: "Error sending verification code" });
  }
};

// ─── Email change: step 2 — confirm the code ──────────────────────────────────
const confirmEmailChange = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Verification code is required" });

    const user = await User.findById(req.userId).select(
      "+pendingEmail +emailVerifyCodeHash +emailVerifyCodeExpires +emailVerifyAttempts"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.pendingEmail || !user.emailVerifyCodeHash || !user.emailVerifyCodeExpires)
      return res.status(400).json({ message: "No email change is in progress" });

    if (user.emailVerifyCodeExpires < new Date())
      return res.status(400).json({ message: "This code has expired — request a new one" });

    if (user.emailVerifyAttempts >= MAX_VERIFY_ATTEMPTS)
      return res.status(429).json({ message: "Too many attempts — request a new code" });

    if (hashCode(code) !== user.emailVerifyCodeHash) {
      user.emailVerifyAttempts += 1;
      await user.save();
      return res.status(400).json({ message: "Incorrect code" });
    }

    user.email = user.pendingEmail;
    user.emailVerified = true;
    user.pendingEmail = "";
    user.emailVerifyCodeHash = null;
    user.emailVerifyCodeExpires = null;
    user.emailVerifyAttempts = 0;
    await user.save();

    return res.status(200).json({ message: "Email verified", user: sanitizeUser(user) });
  } catch (err) {
    console.error("[confirmEmailChange]", err.message);
    return res.status(500).json({ message: "Error verifying code" });
  }
};

// ─── Phone change: step 1 — request a code ────────────────────────────────────
// Requires a country to be selected first — the dial code it implies must
// match the number, so "+212" only pairs with a Morocco number, etc.
const requestPhoneChange = async (req, res) => {
  try {
    const { phone, country, countryCode } = req.body;

    if (!country || !countryCode)
      return res.status(400).json({ message: "Please select your country first" });

    if (!isValidCountryDial(country, countryCode))
      return res.status(400).json({ message: "That dial code doesn't match the selected country" });

    if (!phone || !phone.trim())
      return res.status(400).json({ message: "Phone number is required" });

    const digits = phone.replace(/[^0-9]/g, "");
    if (digits.length < 4 || digits.length > 14)
      return res.status(400).json({ message: "Please enter a valid phone number" });

    const fullPhone = `${countryCode}${digits}`;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const code = generateCode();
    user.pendingPhone = fullPhone;
    user.pendingCountry = country;
    user.pendingCountryCode = countryCode;
    user.phoneVerifyCodeHash = hashCode(code);
    user.phoneVerifyCodeExpires = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
    user.phoneVerifyAttempts = 0;
    await user.save();

    sendVerificationSMS(fullPhone, code).catch(() => {});

    return res.status(200).json({ message: `Verification code sent to ${fullPhone}` });
  } catch (err) {
    console.error("[requestPhoneChange]", err.message);
    return res.status(500).json({ message: "Error sending verification code" });
  }
};

// ─── Phone change: step 2 — confirm the code ──────────────────────────────────
const confirmPhoneChange = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Verification code is required" });

    const user = await User.findById(req.userId).select(
      "+pendingPhone +pendingCountry +pendingCountryCode +phoneVerifyCodeHash +phoneVerifyCodeExpires +phoneVerifyAttempts"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.pendingPhone || !user.phoneVerifyCodeHash || !user.phoneVerifyCodeExpires)
      return res.status(400).json({ message: "No phone change is in progress" });

    if (user.phoneVerifyCodeExpires < new Date())
      return res.status(400).json({ message: "This code has expired — request a new one" });

    if (user.phoneVerifyAttempts >= MAX_VERIFY_ATTEMPTS)
      return res.status(429).json({ message: "Too many attempts — request a new code" });

    if (hashCode(code) !== user.phoneVerifyCodeHash) {
      user.phoneVerifyAttempts += 1;
      await user.save();
      return res.status(400).json({ message: "Incorrect code" });
    }

    user.phone = user.pendingPhone;
    user.country = user.pendingCountry;
    user.countryCode = user.pendingCountryCode;
    user.phoneVerified = true;
    user.pendingPhone = "";
    user.pendingCountry = "";
    user.pendingCountryCode = "";
    user.phoneVerifyCodeHash = null;
    user.phoneVerifyCodeExpires = null;
    user.phoneVerifyAttempts = 0;
    await user.save();

    return res.status(200).json({ message: "Phone verified", user: sanitizeUser(user) });
  } catch (err) {
    console.error("[confirmPhoneChange]", err.message);
    return res.status(500).json({ message: "Error verifying code" });
  }
};

// ─── Google Login ─────────────────────────────────────────────────────────────
const googleLogin = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId)
      return res.status(503).json({ message: "Google login is not configured on this server" });

    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ message: "Google credential token is required" });

    const client = new OAuth2Client(clientId);
    let payload;
    try {
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const { email, name, sub: googleId, picture } = payload;
    if (!email || !googleId)
      return res.status(400).json({ message: "Could not retrieve account info from Google" });

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // New Google user — no avatarBase64 (Google picture URL is not stored as base64 here)
      user = await User.create({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        googleId,
        avatarBase64: "",
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    if (user.status === "suspended")
      return res.status(403).json({ message: "Your account has been suspended. Contact support for help.", code: "ACCOUNT_SUSPENDED" });

    return res.status(200).json(await issueSession(user, res));
  } catch (err) {
    console.error("[googleLogin]", err.message);
    return res.status(500).json({ message: "Error with Google login" });
  }
};

// ─── Refresh access token ─────────────────────────────────────────────────────
// Rotates the refresh token on every use (old one is revoked, a new one is
// issued) — standard practice so a stolen refresh token has a short window.
const refresh = async (req, res) => {
  try {
    // Cookie is the primary source now; body is kept as a fallback only so
    // an old cached frontend build doesn't hard-break mid-rollout.
    const rawToken = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (!rawToken) return res.status(400).json({ message: "refreshToken is required" });

    const doc = await findValidRefreshToken(rawToken);
    if (!doc) return res.status(401).json({ message: "Invalid or expired refresh token" });

    const user = await User.findById(doc.userId);
    if (!user) return res.status(401).json({ message: "Invalid or expired refresh token" });

    if (user.status === "suspended") {
      await revokeAllUserRefreshTokens(user._id);
      return res.status(403).json({ message: "Your account has been suspended. Contact support for help.", code: "ACCOUNT_SUSPENDED" });
    }

    await revokeRefreshToken(rawToken);
    return res.status(200).json(await issueSession(user, res));
  } catch (err) {
    console.error("[refresh]", err.message);
    return res.status(500).json({ message: "Error refreshing session" });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (rawToken) await revokeRefreshToken(rawToken);
    clearRefreshCookie(res);
    res.clearCookie(CSRF_COOKIE, { path: "/" });
    return res.status(200).json({ message: "Logged out" });
  } catch (err) {
    console.error("[logout]", err.message);
    return res.status(500).json({ message: "Error logging out" });
  }
};

// ─── Forgot password ───────────────────────────────────────────────────────────
const RESET_TOKEN_HOURS = 1;

const forgotPassword = async (req, res) => {
  // Always respond the same way whether or not the email exists, so this
  // endpoint can't be used to enumerate registered accounts.
  const genericResponse = () =>
    res.status(200).json({ message: "If an account exists for that email, a reset link has been sent." });

  try {
    const { email } = req.body;
    if (!email || !email.trim()) return genericResponse();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return genericResponse();

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordTokenHash = hashToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_HOURS * 60 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    // Fire-and-forget — don't let mail delivery slow down or fail the response.
    sendPasswordResetEmail(user.email, resetUrl).catch(() => {});

    return genericResponse();
  } catch (err) {
    console.error("[forgotPassword]", err.message);
    return genericResponse();
  }
};

// ─── Reset password ─────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token) return res.status(400).json({ message: "Reset token is required" });
    if (!password || password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const user = await User.findOne({
      resetPasswordTokenHash: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordTokenHash +resetPasswordExpires");

    if (!user) return res.status(400).json({ message: "This reset link is invalid or has expired." });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Force re-login everywhere — protects against a token that leaked
    // alongside an old session.
    await revokeAllUserRefreshTokens(user._id);

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("[resetPassword]", err.message);
    return res.status(500).json({ message: "Error resetting password" });
  }
};

module.exports = {
  register,
  login,
  me,
  updateMe,
  googleLogin,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  requestEmailChange,
  confirmEmailChange,
  requestPhoneChange,
  confirmPhoneChange,
};
