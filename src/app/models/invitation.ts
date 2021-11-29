import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface InvitationAttributes {
  id: number;
  host: number;
  guest: number;
  inviteId: string;
  accepted: boolean;
}

export type InvitationModel = ModelDefined<InvitationAttributes, InvitationAttributes>;

export default (database: Sequelize): InvitationModel => {
  const Invitation: InvitationModel = database.define(
    'Invitation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      host: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        allowNull: false,
      },
      guest: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        allowNull: false,
      },
      inviteId: {
        type: DataTypes.STRING(216),
        allowNull: false,
      },
      accepted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      underscored: true,
      tableName: 'invitations',
    },
  );

  return Invitation;
};
