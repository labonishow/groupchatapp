const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const {
    createGroup,
    addMember,
    getMyGroups,
    getGroupMessages,
} = require("../controllers/groupController");

const router = express.Router();

router.post("/groups", authMiddleware, createGroup);
router.post("/groups/:id/members", authMiddleware, addMember);
router.get("/groups", authMiddleware, getMyGroups);
router.get("/groups/:id/messages", authMiddleware, getGroupMessages);

module.exports = router;