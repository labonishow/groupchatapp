const { Server } = require("socket.io");
const socketAuth = require("./middleware");
const personalChatHandler = require("./handlers/personalChatHandler");
const groupChatHandler = require("./handlers/groupHandler");
const User = require("../models/User");
const Group = require("../models/Group");

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin:
                process.env.NODE_ENV === "production"
                    ? false
                    : ["http://127.0.0.1:5500", "http://localhost:5500"],
        },
    });

    socketAuth(io);

    io.on("connection", async (socket) => {
        console.log(socket.user.name, "connected");

        // Join every group room this user already belongs to,
        // read fresh from the database rather than any in-memory list
        try {
            const user = await User.findByPk(socket.user.id, {
                include: { model: Group, as: "groups", attributes: ["id"] },
            });

            user.groups.forEach((group) => {
                socket.join("group_" + group.id);
            });
        } catch (error) {
            console.error("Error auto-joining groups:", error.message);
        }

        personalChatHandler(socket, io);
        groupChatHandler(socket, io);

        socket.on("disconnect", () => {
            console.log(socket.user.name, "disconnected");
        });
    });

    return io;
};