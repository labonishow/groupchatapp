const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// No associations/includes needed here — this table is just long-term storage,
// not something queried for live chat rendering.
const ArchivedMessage = sequelize.define("ArchivedMessage", {
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
    roomName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

module.exports = ArchivedMessage;