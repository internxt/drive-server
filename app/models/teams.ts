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

export default (database: Sequelize): ModelDefined<TeamAttributes, TeamAttributes> => {
  const Team: ModelDefined<TeamAttributes, TeamAttributes> = database.define(
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
