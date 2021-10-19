import { Sequelize, DataTypes, ModelDefined, Optional } from 'sequelize';

// TODO: This ids are missing relations
interface Attributes {
  id: number,
  userId: number,
  rootAlbumId: string,
  rootPreviewId: string,
  deleteFolderId: string | null
}

interface CreationAttributes extends Optional<Attributes, "id"> {}

export type UserPhotosModel = ModelDefined<Attributes, CreationAttributes>;

export default (database: Sequelize): UserPhotosModel => {
  const UserPhotos: UserPhotosModel = database.define(
    'usersphotos',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
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

  return UserPhotos;
};
