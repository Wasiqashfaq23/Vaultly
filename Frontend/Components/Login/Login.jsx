import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useState } from "react";
import { GoEye, GoEyeClosed } from "react-icons/go";
import "./Login.css";
import { apiFetch } from "../../src/api";

const schema = yup
  .object({
    email: yup.string().trim().required("Email is required").email("Enter a valid email"),
    password: yup.string().required("Password is required"),
  })
  .required();

const Login = ({ setCurrPage }) => {
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState("")
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const onSubmit = async (data) => {
    setLoading(true)
    setError("")
    setInfo("")
    setShowResend(false)
    try {
      const { res, data: result } = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.ok) {
        reset();
        setCurrPage("dashboard");
      } else if (res.status === 403) {
        setVerifyEmail(result?.email || data.email);
        setShowResend(true);
        setError(result?.message || "Please verify your email before logging in.");
      } else {
        setError(result?.message || "Login failed");
      }
    } catch {
      setError("Cannot reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!verifyEmail || resending || countdown > 0) return;
    setResending(true);
    setError("");
    try {
      const { data: result } = await apiFetch("/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: verifyEmail }),
      });
      setInfo(result?.message || "If an account exists with that email, a new verification link has been sent.");
      setCountdown(30);
    } catch {
      setError("Cannot reach the server. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div className="login-container">
        <div className="login-card">
          <h2>Login</h2>
          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                {...register("email")}
                type="email"
                placeholder="Email"
                autoComplete="email"
                disabled={loading}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "login-email-error" : undefined}
              />
              <p className="error" id="login-email-error">{errors.email?.message}</p>
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-input">
                <input
                  id="login-password"
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={loading}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
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
              <p className="error" id="login-password-error">{errors.password?.message}</p>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>
          <div className="login-links">
            <button
              type="button"
              className="link-btn"
              onClick={() => setCurrPage("forgot")}
            >
              Forgot password?
            </button>
          </div>
          {error && (
            <p className="error form-error" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="success form-success" role="status">
              {info}
            </p>
          )}
          {showResend && (
            <button
              type="button"
              className="resend-btn"
              onClick={handleResend}
              disabled={resending || countdown > 0}
            >
              {resending
                ? "Sending…"
                : countdown > 0
                  ? `Resend in ${countdown}s`
                  : "Resend verification email"}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;