"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var TeamInvitation = database.define('teamsinvitations', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        id_team: sequelize_1.DataTypes.INTEGER,
        user: sequelize_1.DataTypes.STRING,
        token: sequelize_1.DataTypes.STRING,
        bridge_password: sequelize_1.DataTypes.STRING,
        mnemonic: sequelize_1.DataTypes.STRING
    }, {
        timestamps: false,
        underscored: true
    });
    return TeamInvitation;
});
