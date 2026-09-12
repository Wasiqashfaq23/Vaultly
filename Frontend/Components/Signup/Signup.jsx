import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { GoEye, GoEyeClosed } from "react-icons/go";
import "./Signup.css";
import { apiFetch } from "../../src/api";
import { passwordScore, strengthLabel } from "../../src/password";

const schema = yup
  .object({
    userName: yup
      .string()
      .trim()
      .required("Username is required")
      .min(6, "Username must be at least 6 characters")
      .max(60, "Username must be at most 60 characters"),
    email: yup.string().trim().required("Email is required").email("Enter a valid email"),
    password: yup.string().required("Password is required").min(8, "Password must be at least 8 characters"),
    confirmPassword: yup
      .string()
      .required("Please confirm your password")
      .oneOf([yup.ref("password")], "Passwords do not match"),
  })
  .required();

const Signup = ({ onSignupSuccess }) => {
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
  } = useForm({ resolver: yupResolver(schema) });

  const passwordValue = watch("password") || "";
  const score = passwordScore(passwordValue);

  const onSubmit = async (data) => {
    setLoading(true)
    setError("")
    const { confirmPassword: _confirmPassword, ...payload } = data;
    try {
      const { res, data: result } = await apiFetch("/signup", {
        method: "POST",
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (res.ok) {
        reset();
        if (typeof onSignupSuccess === "function") {
          onSignupSuccess(payload.email, result?.verificationLink || "");
        }
      } else {
        setError(result?.message || "Signup failed");
      }
    } catch {
      setError("Cannot reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="signup-container">
        <div className="signup-card">
          <h2>Sign Up</h2>
          <form className="signup-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label htmlFor="signup-username">Username</label>
              <input
                id="signup-username"
                {...register("userName")}
                placeholder="Username"
                autoComplete="username"
                disabled={loading}
                aria-invalid={Boolean(errors.userName)}
                aria-describedby={errors.userName ? "signup-username-error" : undefined}
              />
              <p className="error" id="signup-username-error">{errors.userName?.message}</p>
            </div>

            <div className="form-group">
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                {...register("email")}
                type="email"
                placeholder="Email"
                autoComplete="email"
                disabled={loading}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "signup-email-error" : undefined}
              />
              <p className="error" id="signup-email-error">{errors.email?.message}</p>
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <div className="password-input">
                <input
                  id="signup-password"
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={loading}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "signup-password-error" : undefined}
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
              <p className="error" id="signup-password-error">{errors.password?.message}</p>
            </div>

            <div className="form-group">
              <label htmlFor="signup-confirm">Confirm password</label>
              <div className="password-input">
                <input
                  id="signup-confirm"
                  {...register("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  disabled={loading}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? "signup-confirm-error" : undefined}
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
              <p className="error" id="signup-confirm-error">{errors.confirmPassword?.message}</p>
            </div>

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? "Creating account…" : "Sign Up"}
            </button>
          </form>
          {error && (
            <p className="error form-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Signup;