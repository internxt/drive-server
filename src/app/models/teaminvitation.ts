import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface TeamInvitationAttributes {
  id: number;
  idTeam: number;
  user: string;
  token: string;
  bridgePassword: string;
  mnemonic: string;
}

export type TeamInvitationModel = ModelDefined<TeamInvitationAttributes, TeamInvitationAttributes>;

export default (database: Sequelize): TeamInvitationModel => {
  const TeamInvitation: TeamInvitationModel = database.define(
    'teamsinvitations',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      id_team: DataTypes.INTEGER,
      user: DataTypes.STRING,
      token: DataTypes.STRING,
      bridge_password: DataTypes.STRING,
      mnemonic: DataTypes.STRING,
    },
    {
      timestamps: false,
      underscored: true,
    },
  );

  return TeamInvitation;
};
