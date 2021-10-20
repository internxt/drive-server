"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var Folder = database.define('folder', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        parentId: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'folders',
                key: 'id'
            }
        },
        name: {
            type: sequelize_1.DataTypes.STRING
        },
        bucket: {
            type: sequelize_1.DataTypes.STRING(24)
        },
        user_id: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        encrypt_version: {
            type: sequelize_1.DataTypes.STRING
        }
    }, {
        timestamps: true,
        underscored: true,
        indexes: [{ name: 'name', fields: ['name'] }]
    });
    return Folder;
});
