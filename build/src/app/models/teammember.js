"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var TeamMember = database.define('teamsmembers', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        id_team: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false
        },
        user: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        bridge_password: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        bridge_mnemonic: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'teamsmembers',
        timestamps: false,
        underscored: true
    });
    return TeamMember;
});
