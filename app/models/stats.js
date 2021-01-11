module.exports = (sequelize, DataTypes) => {
  const Statistics = sequelize.define('statistics',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING
      },
      user: {
        type: DataTypes.STRING
      },
      userAgent: {
        type: DataTypes.STRING
      }
    },
    {
      timestamps: true,
      underscored: true
    });

  return Statistics;
};
