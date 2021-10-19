import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface PhotoAttributes {
  id: number,
  fileId: string,
  name: string,
  type: string,
  size: number,
  hash: string,
  bucketId: string,
  userId: number,
  creationTime: Date,
  device: string
}

export type PhotoModel = ModelDefined<PhotoAttributes, PhotoAttributes>;

export default (database: Sequelize): PhotoModel => {
  const Photo: PhotoModel = database.define(
    'photos',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      fileId: {
        type: DataTypes.STRING
      },
      name: {
        type: DataTypes.STRING
      },
      type: {
        type: DataTypes.STRING
      },
      size: {
        type: DataTypes.BIGINT.UNSIGNED
      },
      hash: {
        type: DataTypes.STRING
      },
      bucketId: {
        type: DataTypes.STRING
      },
      userId: {
        type: DataTypes.INTEGER,
        // reference: {
        //   model: 'usersphotos',
        //   key: 'id'
        // }
      },
      creationTime: {
        type: DataTypes.DATE,
        allowNull: false
      },
      device: {
        type: DataTypes.STRING
      }
    },
    {
      tableName: 'photos',
      timestamps: true,
      underscored: true
    }
  );

  return Photo;
}
