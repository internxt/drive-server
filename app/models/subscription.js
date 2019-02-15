'use strict';
module.exports = (sequelize, DataTypes) => {
  const subscription = sequelize.define('subscription', {
    user: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    plan: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    creation_time: DataTypes.DATE,
    stripe_customer_id: DataTypes.STRING,
    expiration: DataTypes.DATE,
    is_active: DataTypes.BOOLEAN
  }, {
      timestamps: false
    });
  subscription.associate = function (models) {
    subscription.hasOne(models.User);
    subscription.hasOne(models.plan);
  };
  return subscription;
};