"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
exports.default = (function (database) {
    var User = database.define('users', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        userId: {
            type: sequelize_1.DataTypes.STRING(60)
        },
        name: {
            type: sequelize_1.DataTypes.STRING
        },
        lastname: {
            type: sequelize_1.DataTypes.STRING
        },
        email: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        username: {
            type: sequelize_1.DataTypes.STRING,
            unique: true
        },
        bridgeUser: {
            type: sequelize_1.DataTypes.STRING
        },
        password: {
            type: sequelize_1.DataTypes.STRING
        },
        mnemonic: {
            type: sequelize_1.DataTypes.STRING
        },
        root_folder_id: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'folders',
                key: 'id'
            }
        },
        hKey: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        secret_2FA: {
            type: sequelize_1.DataTypes.STRING
        },
        errorLoginCount: {
            type: sequelize_1.DataTypes.INTEGER
        },
        is_email_activity_sended: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            defaultValue: false
        },
        referral: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true
        },
        syncDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true
        },
        uuid: {
            type: sequelize_1.DataTypes.STRING(36),
            unique: true
        },
        lastResend: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true
        },
        credit: {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 0
        },
        welcomePack: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false
        },
        registerCompleted: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: true
        },
        backupsBucket: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true
        },
        sharedWorkspace: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false
        },
        tempKey: {
            type: sequelize_1.DataTypes.STRING
        }
    }, {
        tableName: 'users',
        timestamps: true,
        underscored: true
    });
    return User;
});
