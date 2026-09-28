const { createMessage } = require("../../controllers/messageController");

module.exports = (socket, io) => {
    console.log(socket.user.name, "connected");

    socket.on("chatMessage", ({ text }) => {
        try {
            const message = createMessage({ user: socket.user, text });

            console.log(socket.user.name, "said", text);

            io.emit("chatMessage", message);
        } catch (error) {
            console.error("socket message error:", error.message);
        }
    });

    socket.on("disconnect", () => {
        console.log(socket.user.name, "disconnected");
    });
};