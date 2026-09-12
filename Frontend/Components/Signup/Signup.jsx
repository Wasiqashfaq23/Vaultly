import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { GoEye, GoEyeClosed } from "react-icons/go";
import "./Signup.css";
import { apiFetch } from "../../src/api";

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
  })
  .required();

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

function passwordScore(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  return Math.min(4, score);
}

const Signup = () => {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
    setSuccess("")
    try {
      const { res, data: result } = await apiFetch("/signup", {
        method: "POST",
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.ok) {
        reset();
        setSuccess(result?.message || "Account created! You can log in now.");
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
              <input
                {...register("userName")}
                placeholder="Username"
                autoComplete="username"
                disabled={loading}
              />
              <p className="error">{errors.userName?.message}</p>
            </div>

            <div className="form-group">
              <input
                {...register("email")}
                type="email"
                placeholder="Email"
                autoComplete="email"
                disabled={loading}
              />
              <p className="error">{errors.email?.message}</p>
            </div>

            <div className="form-group">
              <div className="password-input">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="new-password"
                  disabled={loading}
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
                    {STRENGTH_LABELS[score]} password
                  </span>
                </div>
              )}
              <p className="error">{errors.password?.message}</p>
            </div>

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? "Creating account…" : "Sign Up"}
            </button>
          </form>
          {success && (
            <p className="success form-success" role="status">
              {success}
            </p>
          )}
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