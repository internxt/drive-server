"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var Device = database.define('device', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        mac: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER
        },
        name: {
            type: sequelize_1.DataTypes.STRING
        },
        created_at: {
            type: sequelize_1.DataTypes.VIRTUAL,
            get: function () {
                return this.getDataValue('createdAt');
            }
        },
        platform: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: true
        }
    }, {
        timestamps: true,
        indexes: [{ fields: ['userId', 'mac'], name: 'mac_device_index' }]
    });
    return Device;
});
