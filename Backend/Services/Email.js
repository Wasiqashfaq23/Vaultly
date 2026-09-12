const nodemailer = require("nodemailer")
const { verificationLink, resetLink } = require("./Verification")

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function isMailConfigured() {
  return isSmtpConfigured() || Boolean(process.env.MAIL_RELAY_URL && process.env.MAIL_RELAY_SECRET)
}

function buildTransport() {
  const port = Number(process.env.SMTP_PORT) || 587
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    logger: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function emailFrom() {
  return process.env.EMAIL_FROM || "Vaultly <noreply@vaultly.app>"
}

function template(title, bodyHtml, link, linkLabel) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
      <h2 style="color:#333;margin:0 0 12px;">${title}</h2>
      <p style="color:#555;line-height:1.5;">${bodyHtml}</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${link}" style="display:inline-block;background:#3498db;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">${linkLabel}</a>
      </p>
      <p style="color:#888;font-size:12px;">If the button doesn't work, copy and paste this URL into your browser:<br/>${link}</p>
    </div>
  `
}

async function relayMail({ to, subject, text, html }) {
  const url = process.env.MAIL_RELAY_URL
  const secret = process.env.MAIL_RELAY_SECRET
  if (!url || !secret) {
    return { delivered: false, relayed: false }
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-relay-secret": secret },
      body: JSON.stringify({ from: emailFrom(), to, subject, text, html }),
      signal: AbortSignal.timeout(20000),
    })
    let data = {}
    try {
      data = await res.json()
    } catch (_e) {
      // non-JSON response
    }
    if (res.ok && data.ok) {
      console.log("[Vaultly] email sent via Vercel mail relay")
      return { delivered: true, relayed: true }
    }
    console.log("[Vaultly] mail relay failed:", res.status, data.error || "")
    return { delivered: false, relayed: true }
  } catch (err) {
    console.log("[Vaultly] mail relay error:", err.message || err)
    return { delivered: false, relayed: true }
  }
}

async function sendMail({ to, subject, text, html }) {
  if (!isSmtpConfigured()) return { delivered: false, relayed: false }
  try {
    await buildTransport().sendMail({
      from: emailFrom(),
      to,
      subject,
      text,
      html,
    })
    console.log("[Vaultly] email sent via SMTP")
    return { delivered: true, relayed: false }
  } catch (err) {
    console.log("[Vaultly] SMTP delivery failed, trying Vercel mail relay:", err.message || err)
    return relayMail({ to, subject, text, html })
  }
}

async function sendVerificationEmail(recipient, token) {
  const link = verificationLink(token)

  if (!isSmtpConfigured()) {
    console.log("[Vaultly] SMTP not configured — dev verification link:", link)
    return { delivered: false, relayed: false, link }
  }

  const result = await sendMail({
    to: recipient,
    subject: "Vaultly — Verify your email",
    text: `Welcome to Vaultly!\n\nVerify your email to activate your account:\n${link}\n\nThe link expires in 24 hours.`,
    html: template(
      "Welcome to Vaultly",
      "Thanks for signing up. Please confirm your email address to activate your account. The link expires in <strong>24 hours</strong>.",
      link,
      "Verify my email"
    ),
  })
  result.link = link
  return result
}

async function sendPasswordResetEmail(recipient, token) {
  const link = resetLink(token)

  if (!isSmtpConfigured()) {
    console.log("[Vaultly] SMTP not configured — dev reset link:", link)
    return { delivered: false, relayed: false }
  }

  return sendMail({
    to: recipient,
    subject: "Vaultly — Reset your password",
    text: `We received a request to reset your Vaultly password.\n\nUse the link below to choose a new password:\n${link}\n\nThe link expires in 24 hours. If you didn't request this, you can safely ignore this email.`,
    html: template(
      "Reset your password",
      "We received a request to reset your Vaultly password. Choose a new one with the link below. The link expires in <strong>24 hours</strong>. If you didn't request this, you can safely ignore this email.",
      link,
      "Reset my password"
    ),
  })
}

async function testSmtp() {
  if (!isSmtpConfigured()) return false
  try {
    await buildTransport().verify()
    return true
  } catch (err) {
    console.log("[Vaultly] SMTP self-test failed:", err.message || err)
    return false
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, isSmtpConfigured, isMailConfigured, testSmtp }