"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var Album = database.define('albums', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        name: {
            type: sequelize_1.DataTypes.STRING
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'usersphotos',
                key: 'id'
            }
        }
    }, {
        tableName: 'albums',
        timestamps: true,
        underscored: true
    });
    return Album;
});
