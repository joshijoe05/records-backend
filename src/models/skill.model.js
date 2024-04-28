const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
    {
        skillId: {
            type: String,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        skillCategoryId: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            required: true,
        },
        imageKey: {
            type: String,
            required: false,
        },
    },
    { timestamps: true },
);

const Skill = mongoose.model("skill", skillSchema);

module.exports = Skill;
