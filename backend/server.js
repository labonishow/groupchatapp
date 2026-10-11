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
const { startArchiveJob, archiveOldMessages } = require("./jobs/archiveMessages");
const aiRoutes = require("./routes/aiRoutes");
const allowedOrigins = (
    process.env.FRONTEND_URL || "http://127.0.0.1:5500,http://localhost:5500"
)
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""));

const app = express();
const server = http.createServer(app);

const io = socketIo(server, allowedOrigins);
app.set("io", io);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", groupRoutes);
app.use("/api", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/ai", aiRoutes);
sequelize.sync()
    .then(() => {
        console.log("Database connected");

        server.listen(process.env.PORT || 5000, () => {
            console.log(
                `Server running on port ${process.env.PORT || 5000}`
            );

            startArchiveJob();

           archiveOldMessages(); // remove after testing
        });
    })
    .catch((error) => {
        console.error("Database error:", error);
    });