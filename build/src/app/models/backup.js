"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var Backup = database.define('backup', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        path: {
            type: sequelize_1.DataTypes.TEXT
        },
        fileId: {
            type: sequelize_1.DataTypes.STRING(24)
        },
        deviceId: {
            type: sequelize_1.DataTypes.INTEGER
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER
        },
        hash: {
            type: sequelize_1.DataTypes.STRING
        },
        interval: {
            type: sequelize_1.DataTypes.INTEGER
        },
        size: {
            type: sequelize_1.DataTypes.BIGINT.UNSIGNED
        },
        bucket: {
            type: sequelize_1.DataTypes.STRING(24)
        },
        lastBackupAt: {
            type: sequelize_1.DataTypes.DATE
        },
        enabled: {
            type: sequelize_1.DataTypes.BOOLEAN
        },
        // TODO: Is this required?
        created_at: {
            type: sequelize_1.DataTypes.VIRTUAL,
            get: function () {
                return this.getDataValue('createdAt');
            }
        },
        encrypt_version: {
            type: sequelize_1.DataTypes.STRING
        }
    }, {
        timestamps: true
    });
    return Backup;
});
