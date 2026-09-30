const express = require("express");
const multer = require("multer");

const authMiddleware = require("../middleware/authMiddleware");
const { uploadFile } = require("../controllers/messageController");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});

router.post(
    "/",
    authMiddleware,
    upload.single("file"),
    uploadFile
);

module.exports = router;