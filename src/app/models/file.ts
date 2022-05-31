import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

export interface FileAttributes {
  id: number;
  fileId: string;
  name: string;
  type: string;
  size: number;
  bucket: string;
  folderId: number;
  createdAt: Date;
  encryptVersion: string;
  deleted: boolean;
  deletedAt: Date;
  userId: number;
  modificationTime: Date;
}

export type FileModel = ModelDefined<FileAttributes, FileAttributes>;

export default (database: Sequelize): FileModel => {
  const File: FileModel = database.define(
    'file',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      fileId: {
        type: DataTypes.STRING(24),
      },
      name: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
      },
      size: {
        type: DataTypes.BIGINT.UNSIGNED,
      },
      bucket: {
        type: DataTypes.STRING(24),
      },
      folder_id: {
        type: DataTypes.INTEGER,
      },
      created_at: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('createdAt');
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
      userId: {
        type: DataTypes.INTEGER,
      },
      modificationTime: {
        type: DataTypes.DATE,
      },
    },
    {
      timestamps: true,
      underscored: true,
      indexes: [{ name: 'name', fields: ['name'] }],
    },
  );

  return File;
};
