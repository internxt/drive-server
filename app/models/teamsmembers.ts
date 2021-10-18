import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface TeamsMembersAttributes {
  id: number
  idTeam: number
  user: string
  bridgePassword: string
  bridgeMnemonic: string
}

export function addTeamsMembersModel(database: Sequelize): ModelDefined<TeamsMembersAttributes, TeamsMembersAttributes> {
  const TeamsMembers: ModelDefined<TeamsMembersAttributes, TeamsMembersAttributes> = database.define(
    'teamsmembers',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      id_team: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      user: {
        type: DataTypes.STRING,
        allowNull: false
      },
      bridge_password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      bridge_mnemonic: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      tableName: 'teamsmembers',
      timestamps: false,
      underscored: true
    }
  );

  /**
   * TODO: Relations not done?
   * TeamsMembers.hasOne(models.Team)
   */

  /**
   * TODO: TeamsMember not TeamsMembers, change when typescript migration is completed (is easier then)
   */
  return TeamsMembers;
}
