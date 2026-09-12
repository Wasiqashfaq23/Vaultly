import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import "./Login.css";
import { useState } from "react";

const schema = yup
  .object({
    email: yup.string().required("Email is required"),
    password: yup.string().required("Password is required"),
  })
  .required();

const Login = ({ setCurrPage }) => {
  const [error, seterror] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    reset()
    const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    const result = await res.json();
    if (res.ok) {
      setCurrPage("dashboard");
    } else {
      seterror(result?.message || "Login failed");
    }
  };
  return (
    <>
      <div className="login-container">
        <div className="login-card">
          <h2>Login</h2>
          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <input {...register("email")} placeholder="Email" />
              <p className="error">{errors.email?.message}</p>
            </div>
            <div className="form-group">
              <div>
                <input {...register("password")} type="password" placeholder="Password" />
              </div>
              <p className="error">{errors.password?.message}</p>
            </div>
            <button type="submit" className="login-btn">Login</button>
          </form>
          <p className="signup-link">
          </p>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </div>
    </>
  );
};

export default Login;