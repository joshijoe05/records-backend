const mongoose = require("mongoose");

const youtubeCourseSchema = new mongoose.Schema(
    {
        youtubeCourseId: {
            type: String,
            required: true,
        },
        authorId: {
            type: String,
            required: true,
        },
        playlistId: {
            type: String,
            required: true,
        },
        courseMetaData: { type: Object, required: true },
        courseContent: { type: Object, required: true },
        courseProgress: { type: Object, required: true },
    },
    { timestamps: true },
);

const Youtube_Course = mongoose.model("Youtube_Course", youtubeCourseSchema);

module.exports = Youtube_Course;
