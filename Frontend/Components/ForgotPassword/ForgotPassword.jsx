import { useState } from "react"
import * as yup from "yup"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { apiFetch } from "../../src/api"
import "./ForgotPassword.css"

const schema = yup
  .object({
    email: yup.string().trim().required("Email is required").email("Enter a valid email"),
  })
  .required()

const ForgotPassword = ({ setCurrPage }) => {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  const onSubmit = async (data) => {
    setSending(true)
    setMessage("")
    try {
      const { data: result } = await apiFetch("/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: data.email }),
      })
      setMessage(
        result?.message ||
          "If an account exists with that email, a reset link has been sent."
      )
    } catch {
      setMessage("Cannot reach the server. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <div className="forgot-badge">✉</div>
        <h2>Forgot password</h2>
        <p>
          Enter your account email and we’ll send you a link to reset your password.
        </p>
        <form className="forgot-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={sending}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "forgot-email-error" : undefined}
              {...register("email")}
            />
            <p className="error" id="forgot-email-error">
              {errors.email?.message}
            </p>
          </div>
          <button type="submit" className="forgot-btn" disabled={sending}>
            {sending ? "Sending…" : "Send reset link"}
          </button>
        </form>
        {message && (
          <p className="forgot-message" role="status">
            {message}
          </p>
        )}
        <button type="button" className="link-btn" onClick={() => setCurrPage("login")}>
          Back to Login
        </button>
      </div>
    </div>
  )
}

export default ForgotPassword