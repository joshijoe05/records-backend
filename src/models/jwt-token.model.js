const mongoose = require("mongoose");

const jwt_tokenSchema = new mongoose.Schema(
    {
        jwtTokenId: {
            type: String,
            unique: true,
        },
        token: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

const jwt_token = mongoose.model("jwt_token", jwt_tokenSchema);
module.exports = jwt_token;
