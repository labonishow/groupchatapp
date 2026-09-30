const Message = require("../models/Message");
const User = require("../models/User");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = require("../config/s3");

const saveMessage = async ({ user, text, roomName, mediaUrl, mediaType, fileName }) => {

    if (!text && !mediaUrl) {
        throw new Error("Message must have text or a file");
    }

    if (!roomName) {
        throw new Error("roomName is required");
    }

    const saved = await Message.create({

        text: text || null,

        mediaUrl: mediaUrl || null,

        mediaType: mediaType || null,

        fileName: fileName || null,

        senderId: user.id,

        roomName: roomName

    });

    return {

        id: saved.id,

        text: saved.text,

        mediaUrl: saved.mediaUrl,

        mediaType: saved.mediaType,

        fileName: saved.fileName,

        senderId: saved.senderId,

        roomName: saved.roomName,

        User: { id: user.id, name: user.name },

        createdAt: saved.createdAt

    };

};

// GET /api/messages/:roomName — loads saved history for one private conversation
const getMessages = async (req, res) => {

    try {

        const { roomName } = req.params;

        const messages = await Message.findAll({

            where: { roomName: roomName },

            include: { model: User, attributes: ["id", "name"] },

            order: [["createdAt", "ASC"]]

        });

        res.status(200).json(messages);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });

    }

};

const uploadFile = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                message: "No file selected"
            });

        }

        if (!process.env.AWS_BUCKET_NAME) {

            console.error("AWS_BUCKET_NAME is missing from process.env");

            return res.status(500).json({
                message: "Server is not configured with an S3 bucket name"
            });

        }

        const fileName =
            Date.now() + "-" + req.file.originalname;

        const command = new PutObjectCommand({

            Bucket: process.env.AWS_BUCKET_NAME,

            Key: "chatapp/" + fileName,

            Body: req.file.buffer,

            ContentType: req.file.mimetype,

            ACL: "public-read"

        });

        await s3.send(command);

        const fileUrl =
            `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/chatapp/${fileName}`;

        res.status(200).json({

            url: fileUrl,

            type: req.file.mimetype,

            name: req.file.originalname

        });

    } catch (error) {

        console.error("S3 upload error:", error);

        res.status(500).json({
            message: "File upload failed"
        });

    }

};


module.exports = { saveMessage, getMessages, uploadFile };