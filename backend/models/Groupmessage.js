const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const Group = require("./Group");

const GroupMessage = sequelize.define("GroupMessage", {
    text: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    mediaUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    mediaType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

User.hasMany(GroupMessage, { foreignKey: "senderId" });
GroupMessage.belongsTo(User, { foreignKey: "senderId" });

Group.hasMany(GroupMessage, { foreignKey: "groupId" });
GroupMessage.belongsTo(Group, { foreignKey: "groupId" });

module.exports = GroupMessage;