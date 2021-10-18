import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface TeamAttributes {
  id: number,
  admin: string,
  name: string,
  bridgeUser: string,
  bridgePassword: string,
  bridgeMnemonic: string,
  totalMembers: number
}

type TeamModel = ModelDefined<TeamAttributes, TeamAttributes>;

const create = (database: Sequelize): TeamModel => {
  const Team: TeamModel = database.define(
    'teams',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      admin: DataTypes.STRING,
      name: DataTypes.STRING,
      bridge_user: DataTypes.STRING,
      bridge_password: DataTypes.STRING,
      bridge_mnemonic: DataTypes.STRING,
      total_members: DataTypes.INTEGER
    }, {
    timestamps: false,
    underscored: true
  });

  Team.hasMany(models.user);

  return Team;
}

export { create as default, TeamModel };
