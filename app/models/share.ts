import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface ShareAttributes {
  id: number,
  token: string,
  user: number,
  file: string,
  encryptionKey: string,
  bucket: string,
  fileToken: string,
  isFolder: boolean,
  views: number
}

type ShareModel = ModelDefined<ShareAttributes, ShareAttributes>;

const create = (database: Sequelize): ShareModel => {
  const Share: ShareModel = database.define(
    'shares',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      token: {
        type: DataTypes.STRING,
        unique: true
      },
      user: {
        type: DataTypes.INTEGER
      },
      file: DataTypes.STRING(24),
      encryptionKey: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      bucket: {
        type: DataTypes.STRING(24),
        allowNull: false
      },
      fileToken: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      isFolder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      views: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      }
    }, {
      underscored: true,
      timestamps: false
    }
  );

  Share.hasOne(models.file, { as: 'fileInfo', foreignKey: 'fileId', sourceKey: 'file' });

  return Share;
}

export { create as default, ShareModel };
