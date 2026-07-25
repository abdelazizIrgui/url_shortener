<div align="center">

# 🔗 LinkBlick

**A full-stack, production-grade URL shortener with analytics, campaigns, and bio-link pages.**

[![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

[Features](#-features) •
[Tech Stack](#-tech-stack) •
[Quick Start](#-quick-start) •
[Environment Variables](#-environment-variables) •
[API Reference](#-api-reference) •
[Deployment](#-deployment) •
[Security](#-security)

</div>

---

## 📖 Overview

LinkBlick is a self-hostable link management platform. It lets users shorten URLs, track clicks with real analytics (country, device, referrer), run A/B tests across weighted variants, group links into campaigns, and publish a Linktree-style public bio page — all behind email/password or Google authentication.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Authentication | Email + password (JWT access/refresh tokens) and Google Sign-In (server-verified ID token) |
| 🔗 Short links | Custom or random slugs, optional expiry date, optional title |
| 📊 Click analytics | Country, device, referrer, and a 14-day trend chart per link |
| 🔀 A/B testing | Weighted traffic splitting across multiple destination variants |
| 📁 Campaigns | Group and manage related links together |
| 🪪 Bio Link page | Public, shareable Linktree-style profile page |
| 📱 QR codes | Auto-generated QR code for every short link |
| 🛡️ Abuse reporting | Public endpoint for visitors to report a malicious link |
| 🧑‍💼 Admin dashboard | Manage users, roles, platform-wide stats, links, and campaigns |
| 📝 Posts/Blog | Admin-authored public posts with slugs |
| 🌍 i18n | UI available in English, Arabic, French, Spanish, German, Chinese |
| 🌓 Dark / Light mode | Full theme support |
| 🚦 Rate limiting | Global + strict limits on auth, verification, and report endpoints |
| 🔒 Hardened by default | Helmet, CORS allow-list, Mongo-injection sanitization, XSS sanitization, CSRF protection on cookie routes, account lockout after repeated failed logins |

---

## 🧱 Tech Stack

**Backend** — Node.js, Express 5, MongoDB + Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `helmet`, `express-rate-limit`, `express-mongo-sanitize`, `xss`, `google-auth-library`, `nodemailer`, `qrcode`, `geoip-lite`, `ua-parser-js`

**Frontend** — React 18, React Router 7, Vite

**Database** — MongoDB (Atlas recommended)

---

## 📂 Project Structure

```
url_shortener/
├── backend/
│   ├── server.js                  # App entry — security middleware, rate limits, routes
│   ├── config/
│   │   └── db.js                  # Mongoose connection
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT verification
│   │   ├── admin.middleware.js    # Role gate (requires auth.middleware first)
│   │   ├── csrf.middleware.js     # Double-submit CSRF check (cookie routes only)
│   │   ├── mongoSanitize.middleware.js
│   │   └── xssSanitize.middleware.js
│   ├── model/
│   │   ├── UserModel.js
│   │   ├── UrlModel.js            # Short links + A/B variants
│   │   ├── ClickModel.js          # Per-click analytics
│   │   ├── CampaignModel.js
│   │   ├── BioPageModel.js
│   │   └── PostModel.js
│   ├── controller/                # Business logic per resource
│   ├── routes/                    # Express routers per resource
│   ├── scripts/                   # One-off / maintenance scripts
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── config.js               # Reads Vite env vars (API URL, Google Client ID)
│   │   ├── api.js                  # fetch wrapper + token handling
│   │   ├── i18n.js                 # Translations
│   │   ├── context/                # Auth + language React contexts
│   │   ├── components/             # Shared UI components
│   │   └── pages/                  # Route-level pages
│   ├── public/
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A MongoDB connection string (local, or a free [MongoDB Atlas](https://mongodb.com/atlas) cluster)

### 1. Clone & configure the backend

```bash
cd backend
cp .env.example .env      # then fill in the values — see table below
npm install
npm run dev                # http://localhost:3000
```

### 2. Configure the frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                # http://localhost:5173
```

Open **http://localhost:5173** — the frontend talks to the backend via `VITE_API_URL`.

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|:---:|---|
| `DB_URL` | ✅ | MongoDB connection string |
| `SECRET_KEY` | ✅ | JWT signing secret — long, random, unique per environment. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `PORT` | – | Port the server listens on (default `3000`, usually auto-set by the host) |
| `PUBLIC_BASE_URL` | ✅ | Public URL of this API (used to build short-link URLs) |
| `FRONTEND_URL` | ✅ | Exact origin of the deployed frontend — used for the CORS allow-list |
| `NODE_ENV` | ✅ in prod | Set to `production` to enable secure cookies + HTTPS redirect |
| `COOKIE_SAME_SITE` | – | `lax` (default) if frontend/API share a root domain, `none` if they're on different domains (forces `Secure`, requires HTTPS) |
| `ACCESS_TOKEN_DURATION` | – | Access token lifetime (default `15m`) |
| `REFRESH_TOKEN_DAYS` | – | Refresh token lifetime in days (default `30`) |
| `LOGIN_MAX_ATTEMPTS` | – | Failed logins before an account is locked (default `5`) |
| `LOGIN_LOCK_MINUTES` | – | Lockout duration in minutes (default `15`) |
| `GOOGLE_CLIENT_ID` | – | Enables the Google Sign-In button when set |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | – | Outgoing email for password reset. Left blank in dev, the reset link is logged to the console instead |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|:---:|---|
| `VITE_API_URL` | ✅ | Base URL of the backend API |
| `VITE_GOOGLE_CLIENT_ID` | – | Same Google Client ID as the backend — enables the Google login button |

> ⚠️ **Never commit real `.env` / `.env.local` files.** Only `.env.example` belongs in version control — `.gitignore` already excludes the rest.

---

## 📡 API Reference

Base path: `/api`

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| POST | `/register` | – | Register with name, email, password |
| POST | `/login` | – | Login, returns access token + sets refresh cookie |
| POST | `/google` | – | Exchange a Google ID token for a session |
| POST | `/refresh` | Cookie + CSRF | Issue a new access token |
| POST | `/logout` | Cookie + CSRF | Clear the refresh session |
| POST | `/forgot-password` | – | Request a password reset email |
| POST | `/reset-password` | – | Complete a password reset |
| GET | `/me` | ✅ | Get the current user |
| PATCH | `/me` | ✅ | Update profile |
| POST | `/email/request-change`, `/email/confirm-change` | ✅ | Change account email (verified) |
| POST | `/phone/request-change`, `/phone/confirm-change` | ✅ | Change account phone (verified) |

### Links — `/api/links` (all require auth)

| Method | Path | Description |
|---|---|---|
| GET | `/` | List my links |
| POST | `/` | Create a short link |
| PUT | `/:id` | Update a link |
| DELETE | `/:id` | Delete a link + its click history |
| GET | `/:id/stats` | Click analytics for a link |
| GET | `/:id/qrcode` | QR code (base64) |

### Campaigns — `/api/campaigns` (all require auth)

Standard CRUD: `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`

### Bio Link — `/api/bio`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| GET | `/me` | ✅ | Get my bio page |
| PUT | `/me` | ✅ | Create/update my bio page |
| GET | `/:username` | – | Public bio page view |

### Posts — `/api/posts`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| GET | `/` | – | List published posts |
| GET | `/:slug` | – | Get a published post |
| GET | `/admin/all` | Admin | List all posts (incl. drafts) |
| GET | `/admin/:id` | Admin | Get any post by id |
| POST | `/admin` | Admin | Create a post |
| PUT | `/admin/:id` | Admin | Update a post |
| DELETE | `/admin/:id` | Admin | Delete a post |

### Admin — `/api/admin` (all require an authenticated admin)

`GET /stats` · `GET /users` · `PATCH /users/:id/status` · `PATCH /users/:id/role` · `DELETE /users/:id` · `GET /links` · `GET /campaigns`

### Report — `/api/report`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| POST | `/` | – | Report an abusive/malicious link (rate-limited, 5/15min) |

### Redirect

| Method | Path | Description |
|---|---|---|
| GET | `/:code` | Resolve a short code and redirect, recording the click asynchronously |

---

## ☁️ Deployment

### Backend — Render / Railway / Fly.io

1. Set all required variables from the [Environment Variables](#backend-backendenv) table above in your host's dashboard, **including `NODE_ENV=production`**.
2. Start command: `npm start`
3. Health check endpoint: `GET /health`

### Frontend — Vercel / Netlify / Cloudflare Pages

1. Set `VITE_API_URL` (and `VITE_GOOGLE_CLIENT_ID` if using Google login).
2. Build command: `npm run build`
3. Output directory: `dist`

### Database — MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas).
2. Create a database user with a strong, unique password.
3. Whitelist your host's IP under **Network Access** — use `0.0.0.0/0` only if your host doesn't expose a static IP (typical for Render/Railway free tiers).
4. Copy the connection string into `DB_URL`.

### Google Sign-In (optional)

1. [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials** → create an OAuth 2.0 Client ID (Web application).
2. Add both your dev and production frontend origins to **Authorised JavaScript origins**.
3. Set `GOOGLE_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (frontend) to the same client ID.
4. Leaving either blank simply hides the Google button — email login still works.

---

## 🔒 Security

- **Secrets** — `SECRET_KEY` must be long, random, and unique per environment; never reused between dev/staging/prod.
- **Passwords** — hashed with `bcryptjs`; accounts lock temporarily after repeated failed attempts.
- **Google auth** — the client only ever sends a Google ID token; it's verified server-side via `google-auth-library`, never trusted client-side.
- **Rate limiting** — global (100 req/15 min/IP), strict on auth (10/15 min), stricter on verification codes and abuse reports.
- **CORS** — locked to `FRONTEND_URL` in production; wide open only in local dev when `FRONTEND_URL` is unset.
- **Input sanitization** — Mongo-operator injection and HTML/script payloads are stripped before any route handler runs.
- **CSRF** — double-submit protection on the two routes that rely on the httpOnly refresh cookie (`/refresh`, `/logout`); every other route uses a Bearer token instead, which browsers never attach automatically.
- **Transport** — HTTPS is enforced via redirect + HSTS when `NODE_ENV=production` (TLS itself is terminated upstream by the host).
- **`.env` files are gitignored** — only commit `.env.example`. If a real secret is ever exposed (e.g. shared in chat, committed by accident), rotate it immediately rather than trying to "undo" the exposure.

---

## 🗺️ Roadmap ideas

- [ ] Webhooks on link click
- [ ] Custom domains per user
- [ ] Team / workspace support
- [ ] CSV export for analytics

---

## 🤝 Contributing

1. Fork the repo and create a feature branch: `git checkout -b feature/my-feature`
2. Commit your changes with clear messages
3. Open a pull request describing what changed and why

---

## 📄 License

MIT — free to use, modify, and deploy for personal or commercial projects.
