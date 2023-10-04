import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface Attributes {
  id: string;
  folderId: string;
  ownerId: string;
  sharedWith: string;
  encryptionKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PrivateSharingFolderModel = ModelDefined<Attributes, Attributes>;

export default (database: Sequelize): PrivateSharingFolderModel => {
  const PrivateSharingFolder: PrivateSharingFolderModel = database.define(
    'privateSharingFolder',
    {
      id: {
        type: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      folderId: {
        type: DataTypes.UUIDV4,
        allowNull: false
      },
      ownerId: {
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
      timestamps: true
    },
  );

  return PrivateSharingFolder;
};
