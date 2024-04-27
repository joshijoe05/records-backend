const express = require("express");
const cors = require("cors");

const app = express();

app.use(
    cors({
        origin: ["http://localhost:3000", "https://app.getrecord.in"],
        methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
        credentials: true,
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const routes = require("./routes");
app.use("/api", routes);

module.exports = app;
