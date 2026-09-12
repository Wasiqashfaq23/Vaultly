const crypto = require("crypto")

const VERIFICATION_TTL = 24 * 60 * 60 * 1000 // 24 hours

function generateToken() {
  return crypto.randomBytes(32).toString("hex")
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

function defaultExpiry() {
  return new Date(Date.now() + VERIFICATION_TTL)
}

function getFrontendUrl() {
  return process.env.FRONTEND_URL || "http://localhost:5173"
}

function verificationLink(token) {
  return `${getFrontendUrl()}/?verify-email=${token}`
}

function resetLink(token) {
  return `${getFrontendUrl()}/?reset-password=${token}`
}

module.exports = { generateToken, hashToken, defaultExpiry, verificationLink, resetLink, VERIFICATION_TTL }