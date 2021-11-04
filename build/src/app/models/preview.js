"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var Preview = database.define('previews', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
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
        hash: {
            type: sequelize_1.DataTypes.STRING
        },
        fileId: {
            type: sequelize_1.DataTypes.STRING
        },
        photoId: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'photos',
                key: 'id'
            }
        },
        bucketId: {
            type: sequelize_1.DataTypes.STRING
        }
    }, {
        timestamps: true,
        underscored: true
    });
    return Preview;
});
