const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");

router.post("/register", authController.handleRegister);
router.post("/login", authController.handleLogin);

module.exports = router;
