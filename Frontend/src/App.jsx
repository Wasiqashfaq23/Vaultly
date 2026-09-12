import Signup from '../Components/Signup/Signup'
import Login from '../Components/Login/Login'
import Dashboard from '../Components/Dashboard/Dashboard'
import Navbar from '../Components/Navbar'
import VerifyEmail from '../Components/VerifyEmail/VerifyEmail'
import VerifyPrompt from '../Components/VerifyPrompt/VerifyPrompt'
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
}

function readVerifyToken() {
  return new URLSearchParams(window.location.search).get("verify-email") || ""
}

const App = () => {
  const [verifyToken] = useState(readVerifyToken)
  const [currPage, setCurrPage] = useState(() =>
    verifyToken ? PAGE.VERIFY_EMAIL : PAGE.LOADING
  )
  const [signupEmail, setSignupEmail] = useState("")

  useEffect(() => {
    if (verifyToken) {
      window.history.replaceState({}, "", window.location.pathname)
      return
    }
    let active = true
    apiFetch('/verify-cookie')
      .then(({ res }) => {
        if (active) setCurrPage(res.ok ? PAGE.DASHBOARD : PAGE.LOGIN)
      })
      .catch(() => {
        if (active) setCurrPage(PAGE.LOGIN)
      })
    return () => {
      active = false
    }
  }, [verifyToken])

  const handleSignupSuccess = (email) => {
    setSignupEmail(email)
    setCurrPage(PAGE.VERIFY_PROMPT)
  }

  const handleSessionExpired = () => setCurrPage(PAGE.LOGIN)

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
      {(currPage === PAGE.LOGIN || currPage === PAGE.SIGNUP) && (
        <Navbar setCurrPage={setCurrPage} />
      )}
      {currPage === PAGE.LOGIN && <Login setCurrPage={setCurrPage} />}
      {currPage === PAGE.SIGNUP && <Signup onSignupSuccess={handleSignupSuccess} />}
      {currPage === PAGE.DASHBOARD && <Dashboard onSessionExpired={handleSessionExpired} />}
      {currPage === PAGE.VERIFY_EMAIL && (
        <VerifyEmail token={verifyToken} setCurrPage={setCurrPage} />
      )}
      {currPage === PAGE.VERIFY_PROMPT && (
        <VerifyPrompt email={signupEmail} setCurrPage={setCurrPage} />
      )}
      <ToastHost />
    </>
  )
}

export default App