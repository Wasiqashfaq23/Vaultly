import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import "./Signup.css";

const schema = yup
  .object({
    userName: yup.string().required("Username is required").min(6, "Username must be at least 6 characters"),
    email: yup.string().required("Email is required").email("Enter a valid email"),
    password: yup.string().required("Password is required").min(8, "Password must be at least 8 characters"),
  })
  .required();

const Signup = ({ setCurrPage }) => {
  const [error, seterror] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    reset();
    const result = await res.json();
    if (res.ok) {
      setCurrPage("login");
    } else {
      seterror(result?.message || "Signup failed");
    }
  };

  return (
    <>
      <div className="signup-container">
        <div className="signup-card">
          <h2>Sign Up</h2>
          <form className="signup-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <input {...register("userName")} placeholder="Username" />
              <p className="error">{errors.userName?.message}</p>
            </div>

            <div className="form-group">
              <input {...register("email")} placeholder="Email" />
              <p className="error">{errors.email?.message}</p>
            </div>

            <div className="form-group">
              <input {...register("password")} type="password" placeholder="Password" />
              <p className="error">{errors.password?.message}</p>
            </div>

            <button type="submit" className="signup-btn">Sign Up</button>
          </form>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </div>
    </>
  );
};

export default Signup;