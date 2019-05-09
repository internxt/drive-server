'use strict';

module.exports = (sequelize, DataTypes) => {

    const Share = sequelize.define('shares',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            token: DataTypes.DECIMAL(10, 2),
            user: DataTypes.INTEGER,
            file: DataTypes.STRING,
            mnemonic: DataTypes.STRING
        },
        {
            timestamps: false
        });


    Share.associate = function (models) {
        // associations can be defined here
    };

    return Share;
};