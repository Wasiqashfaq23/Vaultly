import Signup from '../Components/Signup/Signup'
import Login from '../Components/Login/Login'
import Dashboard from '../Components/Dashboard/Dashboard'
import Navbar from '../Components/Navbar'
import VerifyEmail from '../Components/VerifyEmail/VerifyEmail'
import VerifyPrompt from '../Components/VerifyPrompt/VerifyPrompt'
import ForgotPassword from '../Components/ForgotPassword/ForgotPassword'
import ResetPassword from '../Components/ResetPassword/ResetPassword'
import ToastHost from './ToastHost'
import { useEffect, useState } from 'react'
import { apiFetch } from './api'
import './App.css'

const PAGE = {
  LOADING: "loading",
  LOGIN: "login",
  SIGNUP: "signup",
  DASHBOARD: "dashboard",
  VERIFY_EMAIL: "verify-email",
  VERIFY_PROMPT: "verify-prompt",
  FORGOT: "forgot",
  RESET_PASSWORD: "reset-password",
}

function readQueryToken(name) {
  return new URLSearchParams(window.location.search).get(name) || ""
}

const App = () => {
  const [verifyToken] = useState(() => readQueryToken("verify-email"))
  const [resetToken] = useState(() => readQueryToken("reset-password"))
  const [currPage, setCurrPage] = useState(() => {
    if (verifyToken) return PAGE.VERIFY_EMAIL
    if (resetToken) return PAGE.RESET_PASSWORD
    return PAGE.LOADING
  })
  const [signupEmail, setSignupEmail] = useState("")
  const [signupFallbackLink, setSignupFallbackLink] = useState("")
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (verifyToken || resetToken) {
      window.history.replaceState({}, "", window.location.pathname)
      return
    }
    let active = true
    apiFetch('/verify-cookie')
      .then(({ res, data }) => {
        if (!active) return
        if (res.ok) {
          setUser(data || null)
          setCurrPage(PAGE.DASHBOARD)
        } else {
          setCurrPage(PAGE.LOGIN)
        }
      })
      .catch(() => {
        if (active) setCurrPage(PAGE.LOGIN)
      })
    return () => {
      active = false
    }
  }, [verifyToken, resetToken])

  const handleSignupSuccess = (email, fallbackLink) => {
    setSignupEmail(email)
    setSignupFallbackLink(fallbackLink || "")
    setCurrPage(PAGE.VERIFY_PROMPT)
  }

  const handleLoginSuccess = (loggedUser) => {
    setUser(loggedUser || null)
    setCurrPage(PAGE.DASHBOARD)
  }

  const handleSessionExpired = () => {
    setUser(null)
    setCurrPage(PAGE.LOGIN)
  }

  const handleLogout = async () => {
    try {
      await apiFetch('/logout', { method: "POST" })
    } catch {
      /* ignore */
    }
    handleSessionExpired()
  }

  if (currPage === PAGE.LOADING) {
    return (
      <>
        <div className="app-loading">
          <div className="spinner" />
          <p>Loading Vaultly…</p>
        </div>
        <ToastHost />
      </>
    )
  }

  return (
    <>
      <Navbar
        view={currPage === PAGE.DASHBOARD ? "app" : "auth"}
        userName={user?.userName}
        activePage={currPage}
        onNavigate={setCurrPage}
        onLogout={handleLogout}
      />
      {currPage === PAGE.LOGIN && (
        <Login setCurrPage={setCurrPage} onLoginSuccess={handleLoginSuccess} />
      )}
      {currPage === PAGE.SIGNUP && <Signup onSignupSuccess={handleSignupSuccess} />}
      {currPage === PAGE.DASHBOARD && <Dashboard onSessionExpired={handleSessionExpired} />}
      {currPage === PAGE.VERIFY_EMAIL && (
        <VerifyEmail token={verifyToken} setCurrPage={setCurrPage} />
      )}
      {currPage === PAGE.VERIFY_PROMPT && (
        <VerifyPrompt email={signupEmail} fallbackLink={signupFallbackLink} setCurrPage={setCurrPage} />
      )}
      {currPage === PAGE.FORGOT && <ForgotPassword setCurrPage={setCurrPage} />}
      {currPage === PAGE.RESET_PASSWORD && (
        <ResetPassword token={resetToken} setCurrPage={setCurrPage} />
      )}
      <ToastHost />
    </>
  )
}

export default App