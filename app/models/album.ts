import { Sequelize, DataTypes, ModelDefined } from 'sequelize';

interface AlbumAttributes {
  id: number,
  name: string,
  userId: number
}

type AlbumModel = ModelDefined<AlbumAttributes, AlbumAttributes>;

const init = (database: Sequelize): AlbumModel => {
  const Album: AlbumModel = database.define(
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

  return Album;
};

export { init as default, AlbumModel };
