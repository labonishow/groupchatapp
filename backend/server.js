require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const WebSocket = require("ws");

const sequelize = require("./config/db");
const { createMessageFromSocket } = require("./controllers/messageController");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let sockets = [];

wss.on("connection", (ws) => {
    sockets.push(ws);

    ws.on("message", async (raw) => {
        try {
            const { token, text } = JSON.parse(raw);

            const messageWithSender = await createMessageFromSocket({ token, text });
            const payload = JSON.stringify(messageWithSender);

            sockets.forEach((s) => {
                if (s.readyState === WebSocket.OPEN) {
                    s.send(payload);
                }
            });
        } catch (error) {
            console.error("WebSocket message error:", error.message);
        }
    });

    ws.on("close", () => {
        sockets = sockets.filter((s) => s !== ws);
    });
});

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", messageRoutes);

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