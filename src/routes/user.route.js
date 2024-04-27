const express = require("express");
const router = express.Router();

// Importing controllers
const userController = require("../controllers/user.controller");

// Check username availability
router.get(
    "/username-availability",
    userController.handleCheckUsernameAvailability,
);
// Get user profile info
router.get("/profile/:userId", userController.handleGetUserProfileInfo);
// Update user
router.put("/username", userController.handleUpdateUsername);
// On Boarding
router.put("/onboarding", userController.handleOnBoarding);

module.exports = router;
