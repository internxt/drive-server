module.exports = (sequelize, DataTypes) => {
  const Teams = sequelize.define(
    'teams',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      user: DataTypes.STRING,
      name: DataTypes.STRING,
      bridge_user: DataTypes.STRING,
      bridge_password: DataTypes.STRING,
      bridge_email: DataTypes.STRING
    },
    {
      timestamps: false,
    }
  );

  return Teams;
};