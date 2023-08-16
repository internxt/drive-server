import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface Attributes {
  id: number;
  folderId: string;
  ownerId: string;
  sharedWith: string;
}

export type PrivateSharingFolderModel = ModelDefined<Attributes, Attributes>;

export default (database: Sequelize): PrivateSharingFolderModel => {
  const PrivateSharingFolder: PrivateSharingFolderModel = database.define(
    'private_sharing_folder',
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

