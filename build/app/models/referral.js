"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var Referral = database.define('referrals', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        key: {
            type: sequelize_1.DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        type: {
            type: sequelize_1.DataTypes.ENUM('storage'),
            allowNull: false
        },
        credit: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false
        },
        steps: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false
        },
        enabled: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'referrals',
        timestamps: true,
        underscored: true
    });
    return Referral;
});
