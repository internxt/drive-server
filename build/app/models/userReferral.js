"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var UserReferral = database.define('users_referrals', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        user_id: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        referral_id: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'referrals',
                key: 'id'
            }
        },
        referred: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true
        },
        start_date: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW
        },
        expiration_date: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true
        },
        applied: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        tableName: 'users_referrals',
        timestamps: true,
        underscored: true
    });
    return UserReferral;
});
