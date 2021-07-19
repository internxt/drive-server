module.exports = (sequelize, DataTypes) => {
  const coupon = sequelize.define('coupon',
    {
      code: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING
      },
      times_reedemed: {
        type: DataTypes.NUMBER,
        defaultValue: 0
      }
    },
    {
      timestamps: false
    });
  return coupon;
};
