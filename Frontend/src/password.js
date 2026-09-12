const LOWER = "abcdefghijklmnopqrstuvwxyz"
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const DIGITS = "0123456789"
const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?"

function secureRandomInt(max) {
  const buf = new Uint32Array(1)
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(buf)
    return buf[0] % max
  }
  return Math.floor(Math.random() * max)
}

export function generatePassword(length = 20) {
  const pools = [LOWER, UPPER, DIGITS, SYMBOLS]
  const chars = []
  pools.forEach((pool) => chars.push(pool[secureRandomInt(pool.length)]))
  while (chars.length < length) {
    const pool = pools[secureRandomInt(pools.length)]
    chars.push(pool[secureRandomInt(pool.length)])
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join("")
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"]

export function passwordScore(pwd) {
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score += 1
  if (pwd.length >= 12) score += 1
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1
  if (/\d/.test(pwd)) score += 1
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1
  return Math.min(4, score)
}

export function strengthLabel(score) {
  return STRENGTH_LABELS[score] || ""
}