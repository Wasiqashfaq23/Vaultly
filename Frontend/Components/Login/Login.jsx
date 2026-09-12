import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState } from "react";
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
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState("")
  const [resending, setResending] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true)
    setError("")
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
    if (!verifyEmail) return;
    setResending(true);
    setError("");
    try {
      const { data: result } = await apiFetch("/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: verifyEmail }),
      });
      setError(result?.message || "If an account exists with that email, a new verification link has been sent.");
      setShowResend(false);
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
                  autoComplete="current-password"
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
              <p className="error">{errors.password?.message}</p>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>
          {error && (
            <p className="error form-error" role="alert">
              {error}
            </p>
          )}
          {showResend && (
            <button
              type="button"
              className="resend-btn"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;