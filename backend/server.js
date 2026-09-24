require("dotenv").config();

const express = require("express");
const cors = require("cors");

const sequelize = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);

app.get("/", (req, res) => {
    res.send("Backend is working");
});

sequelize.sync()
    .then(() => {
        console.log("Database connected");

        app.listen(process.env.PORT, () => {
            console.log(
                `Server running on http://localhost:${process.env.PORT}`
            );
        });
    })
    .catch((error) => {
        console.error("Database error:", error);
    });