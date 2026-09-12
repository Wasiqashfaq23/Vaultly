const { setUser } = require("../Services/Auth")
const bcrypt = require("bcrypt")
const { User } = require("../Model/User")
const { validateSignup } = require("../utils/validate")

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

function cookieOptions(extra = {}) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    ...extra,
  }
}

function safeUser(user) {
  return {
    _id: user._id,
    userName: user.userName,
    email: user.email,
  }
}

async function handleLogin(req, res) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" })
  }
  const user = await User.findOne({ email })
  if (!user) {
    return res.status(401).json({ message: "Invalid Username or Password" })
  }
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid Username or Password" })
  }
  const token = setUser(user)
  res.cookie("token", token, cookieOptions())
  return res.status(200).json({ message: "Login Successful", user: safeUser(user) })
}

async function handleSignup(req, res) {
  const { userName, email, password } = req.body
  const validation = validateSignup({ userName, email, password })
  if (!validation.valid) {
    return res.status(400).json({ message: validation.errors[0] })
  }
  const alreadyPresent = await User.findOne({ email })
  if (alreadyPresent) {
    return res.status(409).json({ message: "Email already registered" })
  }
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)
  await User.create({
    userName,
    email,
    password: hashedPassword,
  })
  return res.status(201).json({ message: "Signup Successful" })
}

async function handleLogout(req, res) {
  res.cookie("token", "", cookieOptions({ maxAge: 0 }))
  return res.status(200).json({ message: "Logout Successful" })
}

async function fetchUser(req, res) {
  const user = await User.findById(req.user._id)
  if (!user) {
    return res.status(401).json({ message: "No user found" })
  }
  return res.status(200).json(safeUser(user))
}

async function verifyCookie(req, res) {
  const user = await User.findById(req.user._id)
  if (!user) {
    return res.status(401).json({ message: "No user found" })
  }
  return res.status(200).json(safeUser(user))
}

module.exports = { handleLogin, handleSignup, handleLogout, fetchUser, verifyCookie }