const crypto = require("crypto");
const { CSRF_COOKIE, SAME_SITE, secureFlag } = require("../utils/cookies");

const CSRF_HEADER = "x-csrf-token";

// Only the refresh-token cookie is "ambient" (the browser attaches it
// automatically). Every other endpoint in this API is authenticated with a
// Bearer access token, which browsers never attach on their own — so those
// routes are already immune to CSRF and don't need this. This is only
// applied to /api/auth/refresh and /api/auth/logout, the two routes that
// read the refresh cookie.
//
// Double-submit pattern: we hand the browser a second, *readable* cookie
// (csrfToken) alongside the httpOnly one. A legitimate same-origin request
// can read that cookie with JS and echo it back in a header; a cross-site
// attacker's page can trigger the cookie being *sent*, but the
// same-origin policy stops it from ever reading the cookie's value to also
// put it in the header, so the two won't match.
const issueCsrfCookie = (res) => {
  const token = crypto.randomBytes(24).toString("hex");
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: secureFlag(),
    sameSite: SAME_SITE,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return token;
};

const verifyCsrf = (req, res, next) => {
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: "Invalid or missing CSRF token" });
  }
  next();
};

module.exports = { issueCsrfCookie, verifyCsrf, CSRF_HEADER };
