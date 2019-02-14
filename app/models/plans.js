'use strict';
module.exports = (sequelize, DataTypes) => {
  const plans = sequelize.define('plans', {
    name: DataTypes.STRING,
    price: DataTypes.DECIMAL,
    space_gb: DataTypes.INTEGER
  }, {});
  plans.associate = function(models) {
    // associations can be defined here
  };
  return plans;
};