"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var AppSumo = database.define('AppSumo', {
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
        planId: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        uuid: {
            type: sequelize_1.DataTypes.STRING(36),
            allowNull: false
        },
        invoiceItemUuid: {
            type: sequelize_1.DataTypes.STRING(36),
            allowNull: false
        }
    }, {
        timestamps: true,
        underscored: true,
        tableName: 'appsumo'
    });
    return AppSumo;
});
