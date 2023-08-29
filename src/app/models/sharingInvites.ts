import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

export interface SharingInviteAttributes {
  id: string;
  itemId: string;
  itemType: 'file' | 'folder';
  ownerId: string;
  sharedWith: string
  encryptionKey: string;
  encryptionAlgorithm: string;
  createdAt: Date;
  updatedAt: Date;
  type: 'SELF' | 'OWNER';
  roleId: string
}

export type SharingInvitesModel = ModelDefined<SharingInviteAttributes, SharingInviteAttributes>;

export default (database: Sequelize): SharingInvitesModel => {
  const SharingInvites: SharingInvitesModel = database.define(
    'sharingInvites',
    {
      id: {
        type: DataTypes.UUIDV4,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      itemId: {
        type: DataTypes.UUIDV4,
        allowNull: false
      },
      itemType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      sharedWith: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'uuid'
        }
      },
      encryptionKey: {
        type: DataTypes.STRING(800),
        allowNull: false
      },
      encryptionAlgorithm: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.UUIDV4,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        }
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
    },
    {
      tableName: 'sharing_invites',
      underscored: true,
      timestamps: true
    },
  );

  return SharingInvites;
};
