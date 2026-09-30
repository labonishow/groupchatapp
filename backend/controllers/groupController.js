const Group = require("../models/Group");
const GroupMessage = require("../models/Groupmessage");
const User = require("../models/User");

const createGroup = async (req, res) => {
    try {
        const { name, memberIds } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Group name is required",
            });
        }

        const group = await Group.create({ name });

        const ids = Array.isArray(memberIds) ? memberIds : [];
        const uniqueIds = [...new Set([req.userId, ...ids])];

        await group.addMembers(uniqueIds);

        res.status(201).json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
};

const addMember = async (req, res) => {
    try {
        const { userId } = req.body;
        const group = await Group.findByPk(req.params.id);

        if (!group) {
            return res.status(404).json({
                message: "Group not found",
            });
        }

        const requesterIsMember = await group.hasMember(req.userId);

        if (!requesterIsMember) {
            return res.status(403).json({
                message: "Only group members can add people",
            });
        }

        await group.addMember(userId);

        res.status(200).json({
            message: "Member added",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
};

const getMyGroups = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId, {
            include: {
                model: Group,
                as: "groups",
                attributes: ["id", "name"],
            },
        });

        res.status(200).json(user.groups);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
};

const getGroupMessages = async (req, res) => {
    try {
        const group = await Group.findByPk(req.params.id);

        if (!group) {
            return res.status(404).json({
                message: "Group not found",
            });
        }

        const isMember = await group.hasMember(req.userId);

        if (!isMember) {
            return res.status(403).json({
                message: "You are not a member of this group",
            });
        }

        const messages = await GroupMessage.findAll({
            where: { groupId: req.params.id },
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
    createGroup,
    addMember,
    getMyGroups,
    getGroupMessages,
};