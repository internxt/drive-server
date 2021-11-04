"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var Team = database.define('teams', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        admin: sequelize_1.DataTypes.STRING,
        name: sequelize_1.DataTypes.STRING,
        bridge_user: sequelize_1.DataTypes.STRING,
        bridge_password: sequelize_1.DataTypes.STRING,
        bridge_mnemonic: sequelize_1.DataTypes.STRING,
        total_members: sequelize_1.DataTypes.INTEGER
    }, {
        timestamps: false,
        underscored: true
    });
    return Team;
});
