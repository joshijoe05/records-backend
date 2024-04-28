const express = require("express");
const router = express.Router();

// Importing middlewares
const verifyUser = require("../middlewares/user.mw");

// Importing routes
const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const toolsRoute = require("./tools.route");

// Non authorization routes
router.use("/auth", authRoute);

// Authorization routes
router.use("/user", verifyUser, userRoute);
router.use("/tools", verifyUser, toolsRoute);
router.use("/skill", verifyUser, skillRoute);
router.use("/skill-category", verifyUser, skillCategoryRoute);

module.exports = router;
