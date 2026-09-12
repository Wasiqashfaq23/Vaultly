const nodemailer = require("nodemailer")
const { verificationLink } = require("./Verification")

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function buildTransport() {
  const port = Number(process.env.SMTP_PORT) || 587
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function emailFrom() {
  return process.env.EMAIL_FROM || "Vaultly <noreply@vaultly.app>"
}

async function sendVerificationEmail(recipient, token) {
  const link = verificationLink(token)

  if (!isSmtpConfigured()) {
    console.log("[Vaultly] SMTP not configured — dev verification link:", link)
    return false
  }

  await buildTransport().sendMail({
    from: emailFrom(),
    to: recipient,
    subject: "Vaultly — Verify your email",
    text: `Welcome to Vaultly!\n\nVerify your email to activate your account:\n${link}\n\nThe link expires in 24 hours.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
        <h2 style="color:#333;margin:0 0 12px;">Welcome to Vaultly</h2>
        <p style="color:#555;line-height:1.5;">Thanks for signing up. Please confirm your email address to activate your account. The link expires in <strong>24 hours</strong>.</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${link}" style="display:inline-block;background:#3498db;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Verify my email</a>
        </p>
        <p style="color:#888;font-size:12px;">If the button doesn't work, copy and paste this URL into your browser:<br/>${link}</p>
      </div>
    `,
  })
  return true
}

module.exports = { sendVerificationEmail, isSmtpConfigured }