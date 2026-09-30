require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");

const sequelize = require("./config/db");
const socketIo = require("./socket-io");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const groupRoutes = require("./routes/groupRoutes");
const messageRoutes = require("./routes/messageRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
const server = http.createServer(app);

const io = socketIo(server);
app.set("io", io);

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", groupRoutes);
app.use("/api", messageRoutes);
app.use("/api/upload", uploadRoutes);

sequelize.sync()
    .then(() => {
        console.log("Database connected");

        server.listen(process.env.PORT, () => {
            console.log(
                `Server running on http://localhost:${process.env.PORT}`
            );
        });
    })
    .catch((error) => {
        console.error("Database error:", error);
    });