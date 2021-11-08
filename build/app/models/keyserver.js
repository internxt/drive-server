"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var KeyServer = database.define('keyserver', {
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
            },
            allowNull: false
        },
        public_key: {
            type: sequelize_1.DataTypes.STRING(920),
            allowNull: false
        },
        private_key: {
            type: sequelize_1.DataTypes.STRING(1356),
            allowNull: false
        },
        revocation_key: {
            type: sequelize_1.DataTypes.STRING(476),
            allowNull: false
        },
        encrypt_version: {
            type: sequelize_1.DataTypes.STRING
        }
    }, {
        timestamps: true,
        underscored: true,
        freezeTableName: true
    });
    return KeyServer;
});
