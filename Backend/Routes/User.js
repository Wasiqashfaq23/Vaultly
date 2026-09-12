const express=require("express")
const router=express.Router()
const {handleLogin,handleSignup,handleLogout,fetchUser,verifyCookie,handleVerifyEmail,handleResendVerification}=require("../Controller/User")
const { requireAuth } = require("../Middleware/Auth")

router.post('/login',handleLogin);

router.post('/signup',handleSignup)

router.get("/verify-email", handleVerifyEmail)

router.post("/resend-verification", handleResendVerification)

router.post('/logout',handleLogout)

router.get("/me", requireAuth, fetchUser)

router.get("/verify-cookie", requireAuth, verifyCookie)

module.exports = router;