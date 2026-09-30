const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const Group = sequelize.define("Group", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});


Group.belongsToMany(User, { through: "GroupMembers", as: "members" });
User.belongsToMany(Group, { through: "GroupMembers", as: "groups" });

module.exports = Group;