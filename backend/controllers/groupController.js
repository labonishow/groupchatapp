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

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const group = await Group.findByPk(req.params.id);

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const requesterIsMember = await group.hasMember(req.userId);

        if (!requesterIsMember) {
            return res.status(403).json({
                message: "Only group members can add people"
            });
        }

        // Find user using email
        const user = await User.findOne({
            where: {
                email: email.trim()
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "No user found with this email"
            });
        }

        const alreadyMember = await group.hasMember(user.id);

        if (alreadyMember) {
            return res.status(400).json({
                message: "User is already a member"
            });
        }

        // Add the user using the ID internally
        await group.addMember(user.id);

        const io = req.app.get("io");

        if (io) {
            io.to("group_" + group.id).emit("system-message", {
                groupId: group.id,
                text: user.name + " was added to the group"
            });
        }

        res.status(200).json({
            message: "Member added",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {

        console.error("ADD MEMBER ERROR:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const leaveGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.userId;;

        console.log("GROUP ID:", groupId);
        console.log("USER ID:", userId);

        const group = await Group.findByPk(groupId);

        console.log("GROUP:", group);

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const isMember = await group.hasMember(userId);

        console.log("IS MEMBER:", isMember);

        if (!isMember) {
            return res.status(400).json({
                message: "You are not a member of this group"
            });
        }

        const user = await User.findByPk(userId);

        console.log("USER:", user);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        console.log("Removing user from group...");

        await group.removeMember(userId);

        console.log("User removed successfully");

        const io = req.app.get("io");

        if (io) {
            io.to("group_" + group.id).emit("system-message", {
                groupId: group.id,
                text: user.name + " left the group"
            });
        }

        res.status(200).json({
            message: "You left the group"
        });

    } catch (error) {

        console.error("LEAVE GROUP ERROR:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
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
        include: {
            model: User,
            as: "members",
            attributes: ["id", "name"]
        }
    }
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
    leaveGroup
};