const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ArchivedGroupMessage = sequelize.define("ArchivedGroupMessage", {
    originalId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
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
    groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

module.exports = ArchivedGroupMessage;