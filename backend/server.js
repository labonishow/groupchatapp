require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require('socket.io');

const sequelize = require("./config/db");
const { createMessageFromSocket } = require("./controllers/messageController");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin:
            process.env.NODE_ENV === "production"
                ? false
                : ["http://127.0.0.1:5500", "http://localhost:5000"],
    },
});
io.on("connection",(socket)=>{
    socket.on("chatMessage",async({token,text})=>{
        try {
            const messageWithSender = await createMessageFromSocket({token,text});
            console.log("Connected to server:", socket.id, messageWithSender.User.name, "said:",text);
            io.emit("chatMessage",messageWithSender);
           
        } catch (error) {
            console.error("socket message error:",error.message);
        }
    })
})

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