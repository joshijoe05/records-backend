const express = require("express");
const router = express.Router();

// Importing routes
const youtubeRoute = require("./youtube.route");

// Importing middlewares
const verifyUser = require("../middlewares/user.mw");

// Youtube routes
router.use("/youtube", verifyUser, youtubeRoute);

module.exports = router;
