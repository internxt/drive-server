import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface PreviewAttributes {
  id: number
  name: string
  type: string
  size: number
  hash: string
  fileId: string
  photoId: number
  bucketId: string
}

export type PreviewModel = ModelDefined<PreviewAttributes, PreviewAttributes>;

export default (database: Sequelize): PreviewModel => {
  const Preview: PreviewModel = database.define(
    'previews',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
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
      fileId: {
        type: DataTypes.STRING
      },
      photoId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'photos',
          key: 'id'
        }
      },
      bucketId: {
        type: DataTypes.STRING
      }
    },
    {
      timestamps: true,
      underscored: true
    }
  );

  return Preview;
};
