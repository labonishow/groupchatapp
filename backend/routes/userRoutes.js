const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { getUsers } = require("../controllers/userControllers");

const router = express.Router();

router.get("/users", authMiddleware, getUsers);

module.exports = router;