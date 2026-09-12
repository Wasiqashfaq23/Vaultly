require("dotenv").config()
const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()
app.set("trust proxy", 1)
const port = process.env.PORT || 8001

const { connectToMongo } = require("./connect")
const userRouter = require("./Routes/User")
const passRouter = require("./Routes/savedPasswords")
const { testSmtp, isMailConfigured } = require("./Services/Email")

const FALLBACK_ORIGINS = ["http://localhost:5174", "http://localhost:5173"]

function parseOrigins(raw) {
  if (!raw) return []
  const seen = new Set()
  const origins = []
  for (const entry of raw.split(",")) {
    const origin = entry.trim().replace(/\/+$/, "")
    if (origin && !seen.has(origin)) {
      seen.add(origin)
      origins.push(origin)
    }
  }
  return origins
}

const allowedOrigins = (() => {
  const origins = parseOrigins(process.env.CORS_ORIGINS)
  if (origins.length === 0) {
    if (process.env.CORS_ORIGINS) {
      console.warn("[Vaultly] CORS_ORIGINS set but produced no valid origins, falling back to defaults")
    }
    return FALLBACK_ORIGINS
  }
  return origins
})()

console.log("[Vaultly] Allowed CORS origins:", allowedOrigins.join(", ") || "(none)")

const attempts = new Map()

function loginRateLimiter(req, res, next) {
  if (req.path !== "/login" && req.path !== "/signup" && req.path !== "/resend-verification" && req.path !== "/forgot-password") return next()
  const key = `${req.ip}:${req.path}`
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const entry = attempts.get(key) || { count: 0, resetAt: now + windowMs }
  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + windowMs
  }
  entry.count += 1
  attempts.set(key, entry)
  if (entry.count > 10) {
    return res.status(429).json({ message: "Too many attempts. Try again later." })
  }
  next()
}

function errorHandler(err, req, res, next) {
  console.error(err)
  if (res.headersSent) return next(err)
  return res.status(err.status || 500).json({ message: "Something went wrong" })
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(loginRateLimiter)
app.use(express.static("Public"));

app.use("/", userRouter)
app.use("/password", passRouter)

app.use(errorHandler)

connectToMongo(process.env.MONGO_URI).then(() => { console.log("Mongo connected") })

if (isMailConfigured()) {
  testSmtp().then((ok) => {
    console.log(
      ok
        ? "[Vaultly] SMTP self-test: OK (local delivery)"
        : "[Vaultly] SMTP self-test: FAILED (email will fall back to Vercel mail relay)"
    )
  })
} else {
  console.log("[Vaultly] Email service not configured")
}

app.listen(port, () => {
  console.log("Listening at port", port)
})