const Message = require("../models/Message");
const User = require("../models/User");

const sendMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const senderId = req.userId; 

        if (!text) {
            return res.status(400).json({
                message: "Message text is required",
            });
        }

        const message = await Message.create({ text, senderId });
        const messageWithSender = await Message.findByPk(message.id, {
            include: { model: User, attributes: ["id", "name"] },
        });

        res.status(201).json(messageWithSender);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
};

const getMessages = async (req, res) => {
    try {
        const messages = await Message.findAll({
            include: { model: User, attributes: ["id", "name"] },
            order: [["createdAt", "ASC"]],
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
};

module.exports = {
    sendMessage,
    getMessages,
};