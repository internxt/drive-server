import { Sequelize, DataTypes, ModelDefined, Optional } from 'sequelize';

// TODO: This ids are string or integer?
interface UserPhotosAttributes {
  id: number,
  userId: Number,
  rootAlbumId: string,
  rootPreviewId: string,
  deleteFolderId: string | null
}

interface UserPhotosCreationAttributes extends Optional<UserPhotosAttributes, "id"> {}

export function addUserPhotosModel(database: Sequelize): ModelDefined<UserPhotosAttributes, UserPhotosCreationAttributes> {
  const UserPhotos: ModelDefined<UserPhotosAttributes, UserPhotosAttributes> = database.define(
    'usersphotos',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.STRING,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      rootAlbumId: {
        type: DataTypes.STRING
      },
      rootPreviewId: {
        type: DataTypes.STRING
      },
      deleteFolderId: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      tableName: 'usersphotos',
      timestamps: true,
      underscored: true
    }
  );

  UserPhotos.belongsTo(models.users, { foreignKey: 'userId' });
  UserPhotos.hasMany(models.photos, { foreignKey: 'userId' });

  return UserPhotos;
};
