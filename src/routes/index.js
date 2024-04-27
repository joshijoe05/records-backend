const express = require("express");
const router = express.Router();

// Importing middlewares
const verifyUser = require("../middlewares/user.mw");

// Importing routes
const authRoute = require("./auth.route");
const userRoute = require("./user.route");

// Non authorization routes
router.use("/auth", authRoute);

// Authorization routes
router.use("/user", verifyUser, userRoute);

module.exports = router;
