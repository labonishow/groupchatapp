const User = require("../models/User");
const { Op } = require("sequelize");

const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                id: { [Op.ne]: req.userId }, // everyone except the logged-in user
            },
            attributes: ["id", "name", "email"],
            order: [["name", "ASC"]],
        });

        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
};

module.exports = {
    getUsers,
};