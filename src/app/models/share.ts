import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface ShareAttributes {
  id: number;
  token: string;
  mnemonic: string;
  user: number;
  file: string;
  encryptionKey: string;
  bucket: string;
  fileToken: string;
  isFolder: boolean;
  views: number;
  is_folder: boolean;
  active: boolean;
  hashed_password: string;
  userId: string;
}

export type ShareModel = ModelDefined<ShareAttributes, ShareAttributes>;

export default (database: Sequelize): ShareModel => {
  const Share: ShareModel = database.define(
    'shares',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      token: {
        type: DataTypes.STRING,
        unique: true,
      },
      mnemonic: {
        type: DataTypes.BLOB,
      },
      user: {
        type: DataTypes.INTEGER,
      },
      file: DataTypes.STRING(24),
      encryptionKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      bucket: {
        type: DataTypes.STRING(24),
        allowNull: false,
      },
      fileToken: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      is_folder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      views: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      hashed_password: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      code: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      userId: {
        type:  DataTypes.INTEGER
      }
    },
    {
      underscored: true,
      timestamps: false,
    },
  );

  return Share;
};
