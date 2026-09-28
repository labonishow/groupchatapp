const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findByPk(decoded.userId, {
                attributes: ["id", "name"],
            });

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.user = user;
            next();
        } catch (error) {
            console.error("Socket auth error:", error.message);
            next(new Error("Authentication error"));
        }
    });
};