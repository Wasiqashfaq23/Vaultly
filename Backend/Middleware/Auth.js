const { getUser } = require("../Services/Auth")

function requireAuth(req, res, next) {
  const tokenCookie = req.cookies?.token
  const user = getUser(tokenCookie)
  if (!user) {
    return res.status(401).json({ message: "Not authenticated" })
  }
  req.user = user
  next()
}

module.exports = { requireAuth }