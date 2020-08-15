module.exports = (sequelize, DataTypes) => {
  const TeamsMembers = sequelize.define(
    'teams_members',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      id_team: DataTypes.INTEGER,
      user: DataTypes.STRING,
      is_active: DataTypes.BOOLEAN
    },
    {
      timestamps: false
    }
  );

  return TeamsMembers;
};
