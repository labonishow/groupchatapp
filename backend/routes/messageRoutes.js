const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const {
    sendMessage,
    getMessages,
} = require("../controllers/messageController");

const router = express.Router();

router.post("/messages", authMiddleware, sendMessage);

router.get("/messages", authMiddleware, getMessages);

module.exports = router;