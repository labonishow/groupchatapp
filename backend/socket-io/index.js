const { Server } = require("socket.io");
const socketAuth = require("./middleware");
const chatHandler = require("./handlers/chat");

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin:
                process.env.NODE_ENV === "production"
                    ? false
                    : ["http://127.0.0.1:5500", "http://localhost:5000"],
        },
    });

    socketAuth(io);

    io.on("connection", (socket) => {
        chatHandler(socket, io);
    });

    return io;
};