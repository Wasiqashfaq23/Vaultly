import { useState } from "react"
import * as yup from "yup"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { GoEye, GoEyeClosed } from "react-icons/go"
import { apiFetch } from "../../src/api"
import { toast } from "../../src/toast"
import { passwordScore, strengthLabel } from "../../src/password"
import "./ResetPassword.css"

const schema = yup
  .object({
    password: yup
      .string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: yup
      .string()
      .required("Please confirm your password")
      .oneOf([yup.ref("password")], "Passwords do not match"),
  })
  .required()

const ResetPassword = ({ token, setCurrPage }) => {
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  const passwordValue = watch("password") || ""
  const score = passwordScore(passwordValue)

  const onSubmit = async (data) => {
    setLoading(true)
    setError("")
    try {
      const { res, data: result } = await apiFetch("/reset-password", {
        method: "POST",
        body: JSON.stringify({ newPassword: data.password, token }),
      })
      if (res.ok) {
        reset()
        toast("Password reset successfully!")
        setCurrPage("login")
      } else {
        setError(result?.message || "This reset link is invalid or has expired.")
      }
    } catch {
      setError("Cannot reach the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const linkInvalid = error && !error.toLowerCase().includes("server")

  return (
    <div className="reset-container">
      <div className="reset-card">
        <div className="reset-badge">🔒</div>
        <h2>Choose a new password</h2>

        {linkInvalid ? (
          <>
            <p className="error">{error}</p>
            <button
              type="button"
              className="link-btn"
              onClick={() => setCurrPage("forgot")}
            >
              Request a new link
            </button>
          </>
        ) : (
          <>
            <form className="reset-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label htmlFor="reset-password">New password</label>
                <div className="password-input">
                  <input
                    id="reset-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    disabled={loading}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "reset-password-error" : undefined}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <GoEye /> : <GoEyeClosed />}
                  </button>
                </div>
                {!errors.password?.message && passwordValue && (
                  <div className="strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((i) => (
                        <span key={i} className={`bar ${i <= score ? `filled-${score}` : ""}`} />
                      ))}
                    </div>
                    <span className={`strength-label s-${score}`}>
                      {strengthLabel(score)} password
                    </span>
                  </div>
                )}
                <p className="error" id="reset-password-error">
                  {errors.password?.message}
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="reset-confirm">Confirm new password</label>
                <div className="password-input">
                  <input
                    id="reset-confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    disabled={loading}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "reset-confirm-error" : undefined}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <GoEye /> : <GoEyeClosed />}
                  </button>
                </div>
                <p className="error" id="reset-confirm-error">
                  {errors.confirmPassword?.message}
                </p>
              </div>

              <button type="submit" className="reset-btn" disabled={loading}>
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </form>
            <button type="button" className="link-btn" onClick={() => setCurrPage("login")}>
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPassword