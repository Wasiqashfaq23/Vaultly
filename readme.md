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
- 🍪 Session management with JWT stored in an HTTP-only, SameSite cookie
- 🗄️ Save credentials — service, email, and password
- 🔐 AES-256-GCM encryption for every vault entry before it touches the database
- ✏️ Inline edit and delete saved passwords
- 👁️ Toggle password visibility per entry
- 🚪 Ownership checks on update and delete (IDOR-safe)
- 📋 Form validation with React Hook Form + Yup (frontend) and server-side validation
- 🛡️ Login/signup rate limiting + centralized error handling

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
│   │   └── User.js                # Auth logic, sanitized user responses
│   ├── Middleware/
│   │   └── Auth.js                # requireAuth (401 on missing/invalid token)
│   ├── Model/
│   │   ├── savedPasswords.js      # Vault schema
│   │   └── User.js                # Account schema
│   ├── Routes/
│   │   ├── savedPasswords.js
│   │   └── User.js
│   ├── Services/
│   │   └── Auth.js                # JWT sign/verify (no secrets in payload)
│   ├── utils/
│   │   ├── crypto.js              # AES-256-GCM encrypt/decrypt
│   │   └── validate.js            # Server-side validation
│   ├── .env.example
│   ├── connect.js
│   └── index.js                   # App setup, rate limiter, error handler
│
└── Frontend/
    ├── Components/
    │   ├── Dashboard/
    │   ├── Login/
    │   ├── Signup/
    │   └── Navbar.jsx
    ├── src/
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
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

# Optional locally — without SMTP, verification links print to the backend console
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=Vaultly <noreply@example.com>
FRONTEND_URL=http://localhost:5173
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

Vaultly is deployed on **Render** (backend) and **Vercel** (frontend).

For the hosted backend, set the same environment variables in Render's dashboard:

```
MONGO_URI, JWT_SECRET, VAULT_MASTER_KEY, NODE_ENV=production, CORS_ORIGINS,
SMTP_HOST, SMTP_PORT=587, SMTP_USER, SMTP_PASS, EMAIL_FROM, FRONTEND_URL
```

Email verification requires a working SMTP account (Gmail works with an **App Password** — generate it at https://myaccount.google.com/apppasswords; never use your real Gmail password). Set `FRONTEND_URL` to the Vercel frontend URL so emailed links point at the deployed app. Login is blocked until the email is verified (403 + an inline "resend" option).

On Vercel, set `VITE_API_URL` to the Render backend URL and enable automatic deployment for the `Frontend/` root directory. Set `CORS_ORIGINS` (comma-separated) on Render to your production frontend URLs, e.g. `https://vaultly.vercel.app,http://localhost:5173` — cookie-based auth requires the backend to allow the frontend origin with credentials.

> 🚨 Rotate `JWT_SECRET` and `VAULT_MASTER_KEY` if the app was ever public with known credentials.

---

## 📄 License

Released under the [MIT License](./LICENSE). © 2026 Wasiq Ashfaq