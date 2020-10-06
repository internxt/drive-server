module.exports = (sequelize, DataTypes) => {
  const TeamInvitations = sequelize.define(
    'team_invitations',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      id_team: DataTypes.INTEGER,
      user: DataTypes.STRING,
      token: DataTypes.STRING
    },
    {
      timestamps: false
    }
  );

  return TeamInvitations;
};