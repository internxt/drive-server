"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
var PlanTypes;
(function (PlanTypes) {
    PlanTypes["subscription"] = "subscription";
    PlanTypes["oneTime"] = "one_time";
})(PlanTypes || (PlanTypes = {}));
exports.default = (function (database) {
    var Plan = database.define('plan', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER
        },
        name: {
            type: sequelize_1.DataTypes.STRING
        },
        type: {
            type: sequelize_1.DataTypes.ENUM('subscription', 'one_time')
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE
        },
        limit: {
            type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: 'plans',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: false,
                fields: ['name']
            }
        ]
    });
    return Plan;
});
