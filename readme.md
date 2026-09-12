# 🔐 Vaultly

### A full-stack password manager built with the MERN stack — with encryption at rest.

[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white)](https://nodejs.org)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20Web%20Tokens&logoColor=white)](https://jwt.io)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Security Model](#-security-model)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🎯 Overview

Vaultly is a full-stack password manager that lets users securely store, view, edit, and delete credentials for any service. It demonstrates a security-conscious MERN implementation: vault entries are encrypted at rest, sessions use hardened, HTTP-only cookies, and every mutating route enforces per-user ownership.

---

## ✨ Features

- 🔑 User authentication — signup and login with bcrypt-hashed account passwords
- ✉️ Email verification on signup (with resend) and forgot/reset password flows
- 🍪 Session management with JWT stored in an HTTP-only, SameSite cookie (secure against CSRF-free cross-site reads)
- 🗄️ Save credentials — service, email, and password
- 🎲 Built-in strong password generator with a live strength meter
- 🔐 AES-256-GCM encryption for every vault entry before it touches the database
- ✏️ Inline edit and delete with an inline confirmation (no `window.confirm`)
- 👁️ Toggle password visibility per entry + one-click copy to clipboard (auto-cleared after 30s)
- 🚪 Ownership checks on update and delete (IDOR-safe)
- 📋 Form validation with React Hook Form + Yup (frontend) and server-side validation
- 🛡️ Login/signup rate limiting + centralized error handling
- 📱 Responsive layout — the table collapses into card rows on mobile
- 🔁 Resilient email delivery — SMTP first, automatic fallback to a serverless relay (see [Deployment](#-deployment))

---

## 🛡️ Security Model

| Layer | What happens |
|---|---|
| **Vault storage** | Every saved password is encrypted with **AES-256-GCM** (random 12-byte IV + auth tag per entry) using `VAULT_MASTER_KEY` before being written to MongoDB. Plaintext only exists in the server during a single request. |
| **Account passwords** | User login passwords are hashed with **bcrypt (10 rounds)**. The hash is never sent to the client — API responses are sanitized to `_id`, `userName`, `email`. |
| **Sessions** | JWTs contain only `_id` and `email`, expire after **7 days**, and are delivered in an **HTTP-only, SameSite=Lax** cookie (`Secure` in production). |
| **Authorization** | Create/read/update/delete are all scoped by `createdBy`; updates and deletes return 404 for anything that isn't yours. |
| **Abuse** | Login and signup are rate-limited per IP (10 attempts / 15 min). |

> **Known tradeoff:** encryption is **server-side** — the server can decrypt entries it serves. This is a pragmatic, dependency-free design. A future upgrade is *client-side (zero-knowledge)* encryption, where entries are encrypted in the browser with a key derived from the user's master password.

> **Note for existing databases:** if you ran Vaultly before server-side encryption was added, previously stored entries remain as plaintext. Encryption applies to newly created/updated entries — use a fresh database for development.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, React Hook Form, Yup, Vite, ESLint |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt, HTTP-only cookies |
| Encryption | Node `crypto` (AES-256-GCM) |
| Styling | CSS |

---

## 📁 Project Structure

```
Vaultly/
├── Backend/
│   ├── Controller/
│   │   ├── savedPasswords.js      # Vault CRUD (encrypted, ownership-scoped)
│   │   └── User.js                # Auth, email verification, password reset
│   ├── Middleware/
│   │   └── Auth.js                # requireAuth (401 on missing/invalid token)
│   ├── Model/
│   │   ├── savedPasswords.js      # Vault schema
│   │   └── User.js                # Account schema
│   ├── Routes/
│   │   ├── savedPasswords.js
│   │   └── User.js
│   ├── Services/
│   │   ├── Auth.js                # JWT sign/verify (no secrets in payload)
│   │   ├── Email.js               # SMTP delivery + relay fallback
│   │   └── Verification.js        # Email-verify / password-reset tokens & links
│   ├── utils/
│   │   ├── crypto.js              # AES-256-GCM encrypt/decrypt
│   │   └── validate.js            # Server-side validation
│   ├── .env.example
│   ├── connect.js
│   └── index.js                   # App setup, rate limiter, error handler
│
└── Frontend/
    ├── api/
    │   └── sendmail.js            # Vercel serverless mail relay function
    ├── Components/
    │   ├── Dashboard/
    │   ├── Login/
    │   ├── Signup/
    │   ├── ForgotPassword/
    │   ├── ResetPassword/
    │   ├── VerifyEmail/
    │   ├── VerifyPrompt/
    │   └── Navbar.jsx
    ├── src/
    │   ├── App.jsx                # Page router (state-based) + auth state
    │   ├── api.js                 # fetch helper (same-origin /api by default)
    │   ├── index.css              # Design tokens + global reset
    │   ├── ui.css                 # Shared input/button/strength primitives
    │   ├── password.js            # Generator + strength scoring
    │   ├── toast.js / ToastHost   # Lightweight toasts
    │   └── main.jsx
    ├── .env.example
    ├── vercel.json                # Same-origin /api proxy → Render
    └── index.html
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22 (see `.nvmrc`)
- MongoDB (local or Atlas)

### 1. Backend

```bash
cd Backend
npm install
```

Create `Backend/.env` (see `.env.example`):

```env
MONGO_URI=mongodb://localhost:27017/vaultly
JWT_SECRET=<openssl rand -hex 32>
VAULT_MASTER_KEY=<openssl rand -hex 32>
NODE_ENV=development
PORT=8001
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# SMTP for verification/reset emails (Gmail example — use an App Password)
# Optional locally: without SMTP, verification links print to the backend console
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=Vaultly <noreply@example.com>
FRONTEND_URL=http://localhost:5173

# Optional: serverless relay used as a fallback when SMTP delivery fails
# (deployed with the frontend — see api/sendmail.js in the Frontend app)
MAIL_RELAY_URL=http://localhost:5174/api/sendmail
MAIL_RELAY_SECRET=change_me
```

`VAULT_MASTER_KEY` must be 32 bytes (64 hex characters) — generate with:

```bash
openssl rand -hex 32
```

Start the backend:

```bash
npm start        # or: node index.js
```

### 2. Frontend

```bash
cd Frontend
npm install
```

Create `Frontend/.env` (see `.env.example`):

```env
# Optional — defaults to the same-origin /api path (used by the Vercel proxy).
# Set it only for local development:
VITE_API_URL=http://localhost:8001
```

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:5173` — sign up, log in, and save your first entry.

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth Required | Success | Errors |
|--------|----------|-------------|:-------------:|:-------:|:-------|
| POST | `/signup` | Register a new user (sends a verification email) | ❌ | 201 | 400, 409, 500 |
| POST | `/login` | Login and receive session cookie | ❌ | 200 | 400, 401, 403, 429 |
| GET | `/verify-email?token=…` | Verify the email from the emailed link | ❌ | 200 | 400 |
| POST | `/resend-verification` | Resend the verification email | ❌ | 200 | 400 |
| POST | `/forgot-password` | Send a password-reset link by email | ❌ | 200 | 400 |
| POST | `/reset-password?token=…` | Set a new password with the emailed token | ❌ | 200 | 400 |
| POST | `/logout` | Clear session cookie | ❌ | 200 | — |
| GET | `/me` | Get the current user (sanitized) | ✅ | 200 | 401 |
| GET | `/verify-cookie` | Validate the session cookie | ✅ | 200 | 401 |
| GET | `/password` | Get all of your saved passwords | ✅ | 200 | 401 |
| POST | `/password` | Save a new password | ✅ | 201 | 400, 401, 409 |
| PATCH | `/password/:id` | Update your saved password | ✅ | 200 | 400, 401, 404 |
| DELETE | `/password/:id` | Delete your saved password | ✅ | 200 | 400, 401, 404 |

All responses are JSON. Errors use `{ "message": "..." }`.

---

## ☁️ Deployment

Vaultly is deployed on **Render** (backend) and **Vercel** (frontend). The frontend serves API calls and the mail relay through the **same origin**, so auth cookies (`SameSite=Lax`) work without loosening their security settings.

### How the pieces fit together

```
Browser ──> Vercel (frontend, https://vaultly.vercel.app)
              ├── /api/sendmail ──> Gmail SMTP        (serverless mail relay)
              └── /api/* ────────> Render backend     (same-origin proxy)
                                     └── SMTP first, then relay fallback
```

- `Frontend/vercel.json` rewrites `/api/(.*)` to the Render backend. Because the browser only ever talks to the frontend origin, the login cookie is sent normally and `CORS_ORIGINS` matters only for local/full-domain access.
- Emails are sent by the backend via SMTP; if that host is unreachable (e.g. Render restricts outbound SMTP), the backend automatically falls back to `api/sendmail.js` on Vercel, which sends through Gmail. If delivery still fails, the signup response carries a one-time `verificationLink` the UI shows on the "verify your email" screen. Password-reset links are never shown on-screen.

### Render (backend)

Set these in Render's dashboard (Node build, start command `npm start`):

```
MONGO_URI, JWT_SECRET, VAULT_MASTER_KEY, NODE_ENV=production, PORT=8001,
CORS_ORIGINS=https://vaultly.vercel.app,
SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_USER, SMTP_PASS, EMAIL_FROM,
FRONTEND_URL=https://vaultly.vercel.app,
MAIL_RELAY_URL=https://vaultly.vercel.app/api/sendmail, MAIL_RELAY_SECRET
```

Gmail works with an **App Password** — generate one at https://myaccount.google.com/apppasswords; never use your real Gmail password. Set `FRONTEND_URL` to the Vercel frontend URL so emailed links point at the deployed app. `MAIL_RELAY_SECRET` must match Vercel's `RELAY_SECRET`.

### Vercel (frontend)

Create the project with root directory **`Frontend/`** and framework preset **Vite**. Enable the `vercel.json` proxy automatically (commit it — no extra config). Remove/never set `VITE_API_URL` so the app uses the same-origin `/api` path.

Set these environment variables for the serverless relay function:

```
GMAIL_USER=<your gmail address>
GMAIL_PASSWORD=<same app password as SMTP_PASS>
RELAY_SECRET=<long random string — must match Render's MAIL_RELAY_SECRET>
```

> 🚨 Rotate `JWT_SECRET`, `VAULT_MASTER_KEY`, and both relay secrets if the app was ever public with known credentials.

---

## 📄 License

Released under the [MIT License](./LICENSE). © 2026 Wasiq Ashfaq