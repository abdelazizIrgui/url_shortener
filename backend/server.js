require("dotenv").config();
const db = require("./config/db");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const app = express();

// Trust the first proxy hop (Render/Railway/Heroku/Nginx)
// so req.ip reflects the real visitor IP for rate-limiting and geo lookups.
app.set("trust proxy", 1);

// ─── HTTPS enforcement (production only) ─────────────────────────────────────
// TLS is terminated upstream (Render/Railway/Heroku/Nginx), not by Node
// itself — but if a plain-HTTP request ever reaches us in production
// (someone typing http:// directly, an old bookmark, etc.) we redirect to
// HTTPS rather than serve it insecurely. Paired with the HSTS header
// Helmet sets below, so browsers stop attempting HTTP for this host at all
// after the first visit.
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.secure || req.headers["x-forwarded-proto"] === "https") return next();
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

// ─── Security headers (Helmet) ───────────────────────────────────────────────
// This is a JSON API, not an HTML-serving app, so the CSP/COEP directives
// Helmet ships for browser-rendered pages aren't relevant here and can only
// get in the way of cross-origin API calls from the frontend. We keep the
// headers that matter for an API (X-Content-Type-Options, X-Frame-Options,
// HSTS, Referrer-Policy, etc.) and turn off the HTML-page-oriented ones.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ─── CORS ────────────────────────────────────────────────────────────────────
// `credentials: true` + an explicit origin (rather than a wildcard) is
// required for the httpOnly refresh-token cookie to be sent/received
// cross-origin — set FRONTEND_URL in production or cookie-based auth won't
// work from the deployed frontend.
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : true; // allow all in dev (no FRONTEND_URL set)

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// The default express.json() body limit is only 100kb, which is far too
// small for base64-encoded avatar/cover images sent from the registration
// form and the bio-page editor. But applying a large limit to *every*
// route (as before) meant any endpoint — including simple link/campaign
// CRUD — accepted up to 15mb of JSON, a cheap request-flooding vector.
// Instead: a generous limit is scoped to only the specific routes that
// legitimately accept base64 image data, mounted first so they parse the
// body before the small default below ever sees it (body-parser is a
// no-op on a request whose body was already consumed by an earlier parser
// in the chain). Every other route gets a tight 256kb default — comfortably
// above any normal link/campaign/profile payload.
const imageUploadJson = express.json({ limit: "8mb" });
app.use("/api/auth/register", imageUploadJson); // avatarBase64
app.use("/api/auth/me", imageUploadJson); // avatarBase64
app.use("/api/bio/me", imageUploadJson); // avatarBase64 + coverImageBase64

app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());

// ─── Injection / XSS protection ──────────────────────────────────────────────
// Order matters: sanitize the parsed body/query before anything else reads
// from them.
const mongoSanitize = require("./middleware/mongoSanitize.middleware");
const { sanitizeInput } = require("./middleware/xssSanitize.middleware");
app.use(mongoSanitize); // strips Mongo operator keys ($ne, $gt, ".", ...)
app.use(sanitizeInput); // strips HTML/script markup from free-text fields

// ─── Rate Limiting ───────────────────────────────────────────────────────────
// General API limiter — 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Stricter limiter for auth endpoints — 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." },
});

app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

// ─── Routes ─────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth.route");
const linksRoutes = require("./routes/links.route");
const campaignsRoutes = require("./routes/campaigns.route");
const bioPageRoutes = require("./routes/biopage.route");
const reportRoutes = require("./routes/report.route");
const postsRoutes = require("./routes/posts.route");
const adminRoutes = require("./routes/admin.route");
const { redirectShortUrl } = require("./controller/redirect.controller");

// Stricter limiter for public abuse reports — 5 per 15 minutes per IP
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many reports submitted, please try again later." },
});
app.use("/api/report", reportLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/campaigns", campaignsRoutes);
app.use("/api/bio", bioPageRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Unmatched /api/* routes get a clean JSON 404 instead of falling through
// toward the short-link redirect handler below or Express's default
// (non-JSON) 404 page.
app.use("/api", (req, res) => res.status(404).json({ message: "Not found" }));

// Short-link redirect — must stay last to avoid conflicting with API routes
app.get("/:code", redirectShortUrl);

// ─── Centralized error handler ───────────────────────────────────────────────
// Safety net for anything that reaches next(err) without already being
// handled by a route's own try/catch (every controller has one for its
// expected failure paths — this only catches the unexpected ones, e.g. a
// malformed JSON body or an oversized request that express.json() rejects
// before a route ever runs). Always responds with JSON so the frontend
// never has to parse an HTML error page, and never leaks a stack trace.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ message: "Malformed JSON in request body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large" });
  }
  console.error("[unhandled]", err);
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    message: status === 500 ? "Something went wrong. Please try again." : err.message,
  });
});

// Last-resort guards so an unexpected error surfaces in the logs instead of
// silently corrupting server state or crashing without a trace. On an
// uncaught exception we exit deliberately — a process manager (Render,
// systemd, pm2) restarts us into a known-good state rather than us
// continuing to run with something potentially broken.
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
  process.exit(1);
});

// ─── Start ───────────────────────────────────────────────────────────────────
db();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS allowed origin: ${allowedOrigins === true ? "all (dev mode)" : allowedOrigins.join(", ")}`);
});
