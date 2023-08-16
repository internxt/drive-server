import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface Attributes {
  id: number;
  folderId: string;
  ownerId: string;
  sharedWith: string;
}

export type PrivateSharingFolderRoleModel = ModelDefined<Attributes, Attributes>;

export default (database: Sequelize): PrivateSharingFolderRoleModel => {
  const PrivateSharingFolder: PrivateSharingFolderRoleModel = database.define(
    'private_sharing_folder_role',
    {
      id: {
        type: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      ownerId: {
        type: DataTypes.UUIDV4,
        allowNull: false
      },
      folderId: {
        type: DataTypes.UUIDV4,
        allowNull: false
      },
      sharedWith: {
        type: DataTypes.UUIDV4,
        allowNull: false
      },
      encryptionKey: {
        type: DataTypes.STRING,
        allowNull: false
      },
    },
    {
      tableName: 'private_sharing_folder',
      underscored: true,
      timestamps: false
    },
  );

  return PrivateSharingFolder;
};

