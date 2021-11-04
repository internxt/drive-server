"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var Photo = database.define('photos', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        fileId: {
            type: sequelize_1.DataTypes.STRING
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
        bucketId: {
            type: sequelize_1.DataTypes.STRING
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER
        },
        creationTime: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false
        },
        device: {
            type: sequelize_1.DataTypes.STRING
        }
    }, {
        tableName: 'photos',
        timestamps: true,
        underscored: true
    });
    return Photo;
});
