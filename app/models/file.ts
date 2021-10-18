import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface FileAttributes {
  id: number
  path: string
  fileId: string
  deviceId: number
  userId: number
  hash: string
  interval: number
  size: number
  bucket: string
  lastBackupAt: Date
  enabled: boolean
  createdAt: Date,
  encryptVersion: string
}

export function addFileModel(database: Sequelize): ModelDefined<FileAttributes, FileAttributes> {
  const File: ModelDefined<FileAttributes, FileAttributes> = database.define(
    'file',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      path: {
        type: DataTypes.TEXT
      },
      fileId: {
        type: DataTypes.STRING(24)
      },
      deviceId: {
        type: DataTypes.INTEGER
      },
      userId: {
        type: DataTypes.INTEGER
      },
      hash: {
        type: DataTypes.STRING
      },
      interval: {
        type: DataTypes.INTEGER
      },
      size: {
        type: DataTypes.BIGINT.UNSIGNED
      },
      bucket: {
        type: DataTypes.STRING(24)
      },
      lastBackupAt: {
        type: DataTypes.DATE
      },
      enabled: {
        type: DataTypes.BOOLEAN
      },
      // TODO: Is this required?
      created_at: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('createdAt');
        }
      },
      encrypt_version: {
        type: DataTypes.STRING
      }
    },
    {
      timestamps: true
    }
  );

  File.belongsTo(models.folder);
  File.belongsTo(models.users);
  File.hasMany(models.shares, { as: 'shares', foreignKey: 'file', sourceKey: 'fileId' });

  return File;
}
