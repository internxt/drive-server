"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var Share = database.define('shares', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        token: {
            type: sequelize_1.DataTypes.STRING,
            unique: true
        },
        user: {
            type: sequelize_1.DataTypes.INTEGER
        },
        file: sequelize_1.DataTypes.STRING(24),
        encryptionKey: {
            type: sequelize_1.DataTypes.STRING(64),
            allowNull: false
        },
        bucket: {
            type: sequelize_1.DataTypes.STRING(24),
            allowNull: false
        },
        fileToken: {
            type: sequelize_1.DataTypes.STRING(64),
            allowNull: false
        },
        isFolder: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false
        },
        views: {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 1
        }
    }, {
        underscored: true,
        timestamps: false
    });
    return Share;
});
