'use strict';

module.exports = (sequelize, DataTypes) => {

    const share = sequelize.define('shares',
        {
            id: DataTypes.STRING,
            token: DataTypes.DECIMAL(10, 2),
            user: DataTypes.INTEGER,
            file: DataTypes.STRING,
            mnemonic: DataTypes.STRING
        },
        {
            timestamps: false
        });


    share.associate = function (models) {
        // associations can be defined here
    };

    return share;
};