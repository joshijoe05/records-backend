const express = require("express");
const router = express.Router();

// Importing controllers
const youtubeController = require("../controllers/youtube.controller");

// Create Course
router.post("/course", youtubeController.handleCreateYouTubeCourse);
// Create Course
router.get("/course", youtubeController.handleGetAllNotStartedCoursesByUserId);
// Get Course By Id
router.get("/course/:courseId", youtubeController.handleGetCourseDetails);
// Get Course By Id
router.delete(
    "/course/:courseId",
    youtubeController.handleDeleteCourseByCourseId,
);

module.exports = router;
