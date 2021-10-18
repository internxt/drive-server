import { Sequelize, DataTypes, ModelDefined } from 'sequelize';

interface AlbumAttributes {
  id: number,
  name: string,
  userId: number
}

export function addAlbumModel(database: Sequelize) {
  const Album: ModelDefined<AlbumAttributes, AlbumAttributes> = database.define(
    'albums',
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
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'usersphotos',
          key: 'id'
        }
      }
    },
    {
      tableName: 'albums',
      timestamps: true,
      underscored: true
    }
  );

  Album.belongsToMany(models.photos, { through: 'photosalbums' });
  Album.belongsTo(models.usersphotos, { foreignKey: 'userId' });

  return Album;
};
