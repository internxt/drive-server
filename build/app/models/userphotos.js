"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var UserPhotos = database.define('usersphotos', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        rootAlbumId: {
            type: sequelize_1.DataTypes.STRING
        },
        rootPreviewId: {
            type: sequelize_1.DataTypes.STRING
        },
        deleteFolderId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        tableName: 'usersphotos',
        timestamps: true,
        underscored: true
    });
    return UserPhotos;
});
