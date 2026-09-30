const Group = require("../../models/Group");
const GroupMessage = require("../../models/Groupmessage");
const User = require("../../models/User");

module.exports = (socket, io) => {
  socket.on("join-group", async (groupId) => {
    try {
      const group = await Group.findByPk(groupId);

      if (!group) {
        return;
      }
      socket.on("leave-group", (groupId) => {
        socket.leave("group_" + groupId);
      });

      const isMember = await group.hasMember(socket.user.id);

      if (!isMember) {
        console.log(
          socket.user.name,
          "tried to join a group they are not a member of",
        );
        return;
      }

      socket.join("group_" + groupId);
    } catch (error) {
      console.error("join-group error:", error.message);
    }
  });

  socket.on(
    "group-message",
    async ({ groupId, text, mediaUrl, mediaType, fileName }) => {
      try {
        if (!text && !mediaUrl) {
          return;
        }

        const saved = await GroupMessage.create({
          text: text || null,

          mediaUrl: mediaUrl || null,

          mediaType: mediaType || null,

          fileName: fileName || null,

          senderId: socket.user.id,

          groupId: groupId,
        });

        const message = {
          id: saved.id,

          text: saved.text,

          mediaUrl: saved.mediaUrl,

          mediaType: saved.mediaType,

          fileName: saved.fileName,

          senderId: saved.senderId,

          groupId: saved.groupId,

          User: {
            id: socket.user.id,
            name: socket.user.name,
          },

          createdAt: saved.createdAt,
        };

        io.to("group_" + groupId).emit("group-message", message);
      } catch (error) {
        console.error("group-message error:", error.message);
      }
    },
  );
};
