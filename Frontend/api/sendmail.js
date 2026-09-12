import nodemailer from "nodemailer";

const DEFAULT_TIMEOUT = 15000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const secret = req.headers["x-relay-secret"];
  if (!secret || !process.env.RELAY_SECRET || secret !== process.env.RELAY_SECRET) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  const { from, to, subject, text, html } = req.body || {};
  if (!to || !subject) {
    return res.status(400).json({ ok: false, error: "to and subject are required" });
  }
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
    return res.status(500).json({ ok: false, error: "Gmail credentials not configured" });
  }
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      connectionTimeout: DEFAULT_TIMEOUT,
      greetingTimeout: DEFAULT_TIMEOUT,
      socketTimeout: DEFAULT_TIMEOUT,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: from || `Vaultly <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text: text || "",
      html: html || "",
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}