import "./Navbar.css"

const Navbar = ({ view = "auth", userName, activePage, onNavigate, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="logo" role="button" tabIndex={0} onClick={() => onNavigate?.("login")} onKeyDown={(e) => { if (e.key === "Enter") onNavigate?.("login") }}>
        Vaultly
      </div>
      {view === "app" ? (
        <div className="user-info">
          <span className="welcome">Welcome, {userName || "friend"}</span>
          <button type="button" className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      ) : activePage === "login" || activePage === "signup" ? (
        <div className="nav-links">
          {activePage !== "signup" && (
            <button type="button" onClick={() => onNavigate("signup")}>
              Sign Up
            </button>
          )}
          {activePage !== "login" && (
            <button type="button" onClick={() => onNavigate("login")}>
              Login
            </button>
          )}
        </div>
      ) : null}
    </nav>
  )
}

export default Navbar