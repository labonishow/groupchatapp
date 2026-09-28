const { createMessage } = require("../../controllers/messageController");

module.exports = (socket, io) => {
  socket.on("join-room",(roomName)=>{
      socket.join(roomName);
  })
    socket.on("new-message", ({ text,roomName }) => {
            const message = createMessage({ user: socket.user, text });

            console.log(socket.user.name, "said", message);

            io.to(roomName).emit("new-message", message);
       
    });
};