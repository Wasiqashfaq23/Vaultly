const jwt = require("jsonwebtoken")

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production")
  }
  console.warn("WARNING: JWT_SECRET not set. Using an insecure dev-only secret.")
  return "dev-only-secret-do-not-use-in-production"
}

function setUser(user) {
  const token = jwt.sign(
    {
      _id: user._id,
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  )
  return token
}

function getUser(token) {
  if (!token) return null
  try {
    return jwt.verify(token, getJwtSecret())
  } catch (error) {
    return null
  }
}

module.exports = { getUser, setUser }