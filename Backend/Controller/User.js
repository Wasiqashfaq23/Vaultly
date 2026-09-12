const { setUser } = require("../Services/Auth")
const bcrypt = require("bcrypt")
const { User } = require("../Model/User")
const { validateSignup, validatePassword } = require("../utils/validate")
const { generateToken, hashToken, defaultExpiry } = require("../Services/Verification")
const { sendVerificationEmail, sendPasswordResetEmail, isMailConfigured } = require("../Services/Email")

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
    verified: user.verified,
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
  if (!user.verified) {
    return res.status(403).json({
      message: "Please verify your email before logging in.",
      email: user.email,
    })
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
  if (!isMailConfigured() && process.env.NODE_ENV === "production") {
    return res.status(500).json({ message: "Email service is not configured on the server." })
  }
  const alreadyPresent = await User.findOne({ email })
  if (alreadyPresent) {
    return res.status(409).json({ message: "Email already registered" })
  }
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)
  const token = generateToken()
  const user = await User.create({
    userName,
    email,
    password: hashedPassword,
    verificationHash: hashToken(token),
    verificationExpires: defaultExpiry(),
  })
  let sendResult = null
  try {
    sendResult = await sendVerificationEmail(user.email, token)
  } catch (err) {
    console.error("[Vaultly] verification email error:", err)
  }
  if (sendResult && sendResult.delivered) {
    return res.status(201).json({ message: "Account created! Check your inbox to verify your email." })
  }
  return res.status(201).json({
    message: "Account created! The verification email couldn't be sent — use the link below to verify your email instead.",
    verificationLink: sendResult ? sendResult.link : undefined,
  })
}

async function handleVerifyEmail(req, res) {
  const token = req.query.token
  if (!token) {
    return res.status(400).json({ message: "Verification token is missing." })
  }
  const user = await User.findOne({
    verificationHash: hashToken(token),
    verificationExpires: { $gt: Date.now() },
  })
  if (!user) {
    return res.status(400).json({ message: "This verification link is invalid or has expired." })
  }
  if (!user.verified) {
    user.verified = true
    user.verificationHash = null
    user.verificationExpires = null
    await user.save()
  }
  return res.status(200).json({ message: "Email verified! You can log in now.", verified: true })
}

async function handleResendVerification(req, res) {
  const generic = "If an account exists with that email, a new verification link has been sent."
  const { email } = req.body
  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Email is required." })
  }
  try {
    const user = await User.findOne({ email })
    if (user && !user.verified) {
      const token = generateToken()
      user.verificationHash = hashToken(token)
      user.verificationExpires = defaultExpiry()
      await user.save()
      await sendVerificationEmail(user.email, token)
    }
    return res.status(200).json({ message: generic })
  } catch {
    return res.status(200).json({ message: generic })
  }
}

async function handleForgotPassword(req, res) {
  const generic = "If an account exists with that email, a reset link has been sent."
  const { email } = req.body
  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Email is required." })
  }
  try {
    const user = await User.findOne({ email })
    if (user) {
      if (user.verified) {
        const token = generateToken()
        user.resetHash = hashToken(token)
        user.resetExpires = defaultExpiry()
        await user.save()
        await sendPasswordResetEmail(user.email, token)
      } else {
        const token = generateToken()
        user.verificationHash = hashToken(token)
        user.verificationExpires = defaultExpiry()
        await user.save()
        await sendVerificationEmail(user.email, token)
      }
    }
    return res.status(200).json({ message: generic })
  } catch {
    return res.status(200).json({ message: generic })
  }
}

async function handleResetPassword(req, res) {
  const { token, newPassword } = req.body
  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Reset token is missing." })
  }
  const passwordError = validatePassword(newPassword)
  if (passwordError) {
    return res.status(400).json({ message: passwordError })
  }
  const user = await User.findOne({
    resetHash: hashToken(token),
    resetExpires: { $gt: Date.now() },
  })
  if (!user) {
    return res.status(400).json({ message: "This reset link is invalid or has expired." })
  }
  const salt = await bcrypt.genSalt(10)
  user.password = await bcrypt.hash(newPassword, salt)
  user.verified = true
  user.resetHash = null
  user.resetExpires = null
  await user.save()
  return res.status(200).json({ message: "Password reset successfully. You can log in now." })
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

module.exports = { handleLogin, handleSignup, handleLogout, fetchUser, verifyCookie, handleVerifyEmail, handleResendVerification, handleForgotPassword, handleResetPassword }