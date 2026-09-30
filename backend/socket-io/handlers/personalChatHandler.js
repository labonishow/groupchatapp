const { saveMessage } = require("../../controllers/messageController");

module.exports = (socket, io) => {

    socket.on("join-room", (roomName) => {

        socket.join(roomName);

        console.log(socket.user.name, "joined room:", roomName);

    });

    socket.on("new-message", async ({ text, roomName, mediaUrl, mediaType, fileName }) => {

        try {

            const message = await saveMessage({
                user: socket.user,
                text,
                roomName,
                mediaUrl,
                mediaType,
                fileName
            });

            io.to(roomName).emit("new-message", message);

        } catch (error) {

            console.error("new-message error:", error.message);

        }

    });

};