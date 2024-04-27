const mongoose = require("mongoose");

const verificationTokenSchema = new mongoose.Schema(
    {
        verificationTokenId: {
            type: String,
            unique: true,
        },
        userId: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

const verification_token = mongoose.model(
    "verification_token",
    verificationTokenSchema,
);

module.exports = verification_token;
