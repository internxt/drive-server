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

export function addFileModel(database: Sequelize): ModelDefined<PreviewAttributes, PreviewAttributes> {
  const Preview: ModelDefined<PreviewAttributes, PreviewAttributes> = database.define(
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

  Preview.belongsTo(models.photos, { foreignKey: 'photoId' });

  return Preview;
}
