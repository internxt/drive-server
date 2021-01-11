module.exports = (sequelize, DataTypes) => {
  const icon = sequelize.define('icon',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING
      }
    },
    {
      timestamps: false,
      underscored: true
    });

  return icon;
};
