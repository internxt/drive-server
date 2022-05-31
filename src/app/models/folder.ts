import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

export interface FolderAttributes {
  id: number;
  parentId: number;
  name: string;
  bucket: string;
  userId: number;
  encryptVersion: string;
  deleted: boolean;
  deletedAt: Date;
}

export type FolderModel = ModelDefined<FolderAttributes, FolderAttributes>;

export default (database: Sequelize): FolderModel => {
  const Folder: FolderModel = database.define(
    'folder',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      parentId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'folders',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING,
      },
      bucket: {
        type: DataTypes.STRING(24),
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      encrypt_version: {
        type: DataTypes.STRING,
      },
      deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      underscored: true,
      indexes: [{ name: 'name', fields: ['name'] }],
    },
  );

  return Folder;
};
