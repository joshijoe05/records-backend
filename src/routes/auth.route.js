const express = require("express");
const router = express.Router();

// Importing controllers
const authController = require("../controllers/auth.controller");

// Importing middlewares
const verifyUser = require("../middlewares/user.mw");

// Manual Auth Routes
router.post("/register", authController.handleRegister);
router.post("/login", authController.handleLogin);
router.post("/logout", authController.handleLogout);

// Verification routes
router.post(
    "/send/verification-email",
    verifyUser,
    authController.handleSendVerificationEmail,
);
router.post("/verify-email", authController.handleVerifyEmail);

// Session routes
router.post("/verify-session", authController.handleVerifiySession);

// reset password routes
router.post("/send/reset-password-email", authController.handleSendResetPassMail);
router.post("/reset-password", authController.handleResetPass);

module.exports = router;
