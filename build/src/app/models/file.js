"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var File = database.define('file', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        fileId: {
            type: sequelize_1.DataTypes.STRING(24)
        },
        name: {
            type: sequelize_1.DataTypes.STRING
        },
        type: {
            type: sequelize_1.DataTypes.STRING
        },
        size: {
            type: sequelize_1.DataTypes.BIGINT.UNSIGNED
        },
        bucket: {
            type: sequelize_1.DataTypes.STRING(24)
        },
        folder_id: {
            type: sequelize_1.DataTypes.INTEGER
        },
        created_at: {
            type: sequelize_1.DataTypes.VIRTUAL,
            get: function () {
                return this.getDataValue('createdAt');
            }
        },
        encrypt_version: {
            type: sequelize_1.DataTypes.STRING
        },
        deleted: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false
        },
        deletedAt: {
            type: sequelize_1.DataTypes.DATE
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER
        },
        modificationTime: {
            type: sequelize_1.DataTypes.DATE
        }
    }, {
        timestamps: true,
        underscored: true,
        indexes: [{ name: 'name', fields: ['name'] }]
    });
    return File;
});
