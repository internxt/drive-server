'use strict';
module.exports = (sequelize, DataTypes) => {
  const plan = sequelize.define('plans', {
    name: DataTypes.STRING,
    price_eur: DataTypes.DECIMAL(10, 2),
    space_gb: DataTypes.INTEGER,
    stripe_plan_id: DataTypes.STRING
  }, {
      timestamps: false
    });
  plan.associate = function (models) {
    // associations can be defined here
  };
  return plan;
};