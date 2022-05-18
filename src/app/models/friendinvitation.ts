import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface FriendInvitationAttributes {
  id: number;
  host: number;
  guestEmail: string;
  accepted: boolean;
}

export type FriendInvitationModel = ModelDefined<FriendInvitationAttributes, FriendInvitationAttributes>;

export default (database: Sequelize): FriendInvitationModel => {
  const FriendInvitation: FriendInvitationModel = database.define(
    'FriendInvitation',
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
      guestEmail: {
        type: DataTypes.STRING,
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
      tableName: 'friend_invitations',
    },
  );

  return FriendInvitation;
};
