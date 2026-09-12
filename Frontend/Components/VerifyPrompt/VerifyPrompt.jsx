import { useEffect, useState } from "react"
import { apiFetch } from "../../src/api"
import "./VerifyPrompt.css"

const VerifyPrompt = ({ email, fallbackLink, setCurrPage }) => {
  const [countdown, setCountdown] = useState(0)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleResend = async () => {
    if (sending) return
    setSending(true)
    setMessage("")
    try {
      const { data } = await apiFetch("/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      })
      setMessage(data?.message || "A new verification link has been sent.")
      setCountdown(30)
    } catch {
      setMessage("Cannot reach the server. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="verify-prompt-container">
      <div className="verify-prompt-card">
        {fallbackLink ? (
          <>
            <div className="verify-badge warn">⚠</div>
            <h2>Verify your email</h2>
            <p>
              We couldn’t deliver the email to{" "}
              <strong>{email || "your email"}</strong>. The link below will verify
              your account (expires in 24 hours).
            </p>
            <a href={fallbackLink} className="verify-fallback-link">
              Verify my email
            </a>
          </>
        ) : (
          <>
            <div className="verify-badge info">✉</div>
            <h2>Check your inbox</h2>
            <p>
              We emailed a verification link to{" "}
              <strong>{email || "your email"}</strong>.
            </p>
          </>
        )}
        <p className="verify-hint">
          The link expires in 24 hours. After verifying, you’ll be able to log in.
        </p>
        <button
          type="button"
          className="verify-secondary-btn wide"
          onClick={handleResend}
          disabled={sending || countdown > 0}
        >
          {sending
            ? "Sending…"
            : countdown > 0
              ? `Resend in ${countdown}s`
              : "Resend email"}
        </button>
        {message && <p className="verify-message">{message}</p>}
        <button type="button" className="link-btn" onClick={() => setCurrPage("login")}>
          Back to Login
        </button>
      </div>
    </div>
  )
}

export default VerifyPrompt