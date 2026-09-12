import Signup from '../Components/Signup/Signup'
import Login from '../Components/Login/Login'
import Dashboard from '../Components/Dashboard/Dashboard'
import Navbar from '../Components/Navbar'
import ToastHost from './ToastHost'
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api'
import './App.css'

const PAGE = {
  LOADING: "loading",
  LOGIN: "login",
  SIGNUP: "signup",
  DASHBOARD: "dashboard",
}

const App = () => {
  const [currPage, setCurrPage] = useState(PAGE.LOADING)

  useEffect(() => {
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
  }, [])

  const handleSessionExpired = useCallback(() => setCurrPage(PAGE.LOGIN), [])

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
      {currPage === PAGE.SIGNUP && <Signup />}
      {currPage === PAGE.DASHBOARD && (
        <Dashboard onSessionExpired={handleSessionExpired} />
      )}
      <ToastHost />
    </>
  )
}

export default App