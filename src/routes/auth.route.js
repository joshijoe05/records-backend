const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");

// Manual Auth Routes
router.post("/register", authController.handleRegister);
router.post("/login", authController.handleLogin);
router.post("/logout", authController.handleLogout);

module.exports = router;
