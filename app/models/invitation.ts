import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface InvitationAttributes {
  id: number
  host: number
  guest: number
  inviteId: string
  accepted: boolean
}

export function addInvitationModel(database: Sequelize): ModelDefined<InvitationAttributes, InvitationAttributes> {
  const Invitation: ModelDefined<InvitationAttributes, InvitationAttributes> = database.define(
    'Invitation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      host: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: false
      },
      guest: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: false
      },
      inviteId: {
        type: DataTypes.STRING(216),
        allowNull: false
      },
      accepted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      timestamps: true,
      underscored: true,
      tableName: 'invitations'
    }
  );

  Invitation.belongsTo(models.users, { foreignKey: 'host', targetKey: 'id' });
  Invitation.belongsTo(models.users, { foreignKey: 'guest', targetKey: 'id' });

  return Invitation;
}
