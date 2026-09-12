import React from "react";
import "./Navbar.css";

const Navbar = ({ setCurrPage }) => {
  return (
    <nav className="navbar">
      <div className="logo">Vaultly</div>
      <div className="nav-links">
        <button type="button" onClick={() => setCurrPage("login")}>Login</button>
        <button type="button" onClick={() => setCurrPage("signup")}>Sign Up</button>
      </div>
    </nav>
  );
};

export default Navbar;