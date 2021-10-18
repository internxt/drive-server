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

export default (database: Sequelize): ModelDefined<PhotoAttributes, PhotoAttributes> => {
  const Photo: ModelDefined<PhotoAttributes, PhotoAttributes> = database.define(
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
        reference: {
          model: 'usersphotos',
          key: 'id'
        }
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

  Photo.belongsToMany(models.albums, { through: 'photosalbums' });
  Photo.hasOne(models.usersphotos, { foreignKey: 'userId' });
  Photo.hasOne(models.previews)

  return Photo;
}
