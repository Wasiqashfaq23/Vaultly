import { useEffect, useState } from "react"
import { apiFetch } from "../../src/api"
import "./VerifyEmail.css"

const VerifyEmail = ({ token, setCurrPage }) => {
  const [status, setStatus] = useState("verifying") // verifying | success | error
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [resending, setResending] = useState(false)

  useEffect(() => {
    let active = true
    apiFetch(`/verify-email?token=${encodeURIComponent(token)}`)
      .then(({ data }) => {
        if (!active) return
        if (data.verified) {
          setStatus("success")
          setMessage(data.message || "Email verified!")
        } else {
          setStatus("error")
          setMessage(data.message || "This verification link is invalid or has expired.")
        }
      })
      .catch(() => {
        if (active) {
          setStatus("error")
          setMessage("Cannot reach the server. Please try again.")
        }
      })
    return () => {
      active = false
    }
  }, [token])

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    setMessage("")
    try {
      const { data } = await apiFetch("/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      })
      setEmail("")
      setMessage(
        data?.message ||
          "If an account exists with that email, a new verification link has been sent."
      )
    } catch {
      setMessage("Cannot reach the server. Please try again.")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="verify-container">
      <div className="verify-card">
        {status === "verifying" && (
          <>
            <div className="verify-spinner" />
            <h2>Verifying your email…</h2>
          </>
        )}

        {status === "success" && (
          <>
            <div className="verify-badge success">✓</div>
            <h2>Email verified!</h2>
            <p>{message}</p>
            <button
              type="button"
              className="verify-primary-btn"
              onClick={() => setCurrPage("login")}
            >
              Go to Login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="verify-badge error">!</div>
            <h2>Link invalid or expired</h2>
            <p>{message}</p>
            <div className="resend-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email"
              />
              <button
                type="button"
                className="verify-secondary-btn"
                onClick={handleResend}
                disabled={resending || !email}
              >
                {resending ? "Sending…" : "Send a new link"}
              </button>
            </div>
            <button type="button" className="link-btn" onClick={() => setCurrPage("login")}>
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail