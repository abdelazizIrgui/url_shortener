const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
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
} = require("../controller/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { verifyCsrf } = require("../middleware/csrf.middleware");

// Verification codes are sensitive to brute-force/spam — keep this tight,
// separate from the general API limiter.
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later." },
});

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
// /refresh and /logout are the only two routes that read the httpOnly
// refresh-token cookie, which the browser attaches automatically — so
// they're the only ones that need the CSRF double-submit check. Every
// other route is authenticated with a Bearer access token instead, which
// browsers never attach on their own.
router.post("/refresh", verifyCsrf, refresh);
router.post("/logout", verifyCsrf, logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authMiddleware, me);
router.patch("/me", authMiddleware, updateMe);

router.post("/email/request-change", authMiddleware, verifyLimiter, requestEmailChange);
router.post("/email/confirm-change", authMiddleware, verifyLimiter, confirmEmailChange);
router.post("/phone/request-change", authMiddleware, verifyLimiter, requestPhoneChange);
router.post("/phone/confirm-change", authMiddleware, verifyLimiter, confirmPhoneChange);

module.exports = router;
