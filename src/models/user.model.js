const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        username: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: false },
        isActive: { type: Boolean, default: false },
        profilePicture: { type: String, required: false },
        profileImageKey: { type: String, required: false },
        isUsernameUpdated: { type: Boolean, default: false },
        isOnBoardingCompleted: { type: Boolean, default: false },
        skills: { type: Array, default: [] },
        isEmailVerified: { type: Boolean, default: false },
    },
    { timestamps: true },
);

const User = mongoose.model("User", userSchema);
module.exports = User;
