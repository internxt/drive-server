import { Sequelize, DataTypes, ModelDefined } from 'sequelize';

interface AlbumAttributes {
  id: number;
  name: string;
  userId: number;
}

export type AlbumModel = ModelDefined<AlbumAttributes, AlbumAttributes>;

export default (database: Sequelize): AlbumModel => {
  const Album: AlbumModel = database.define(
    'albums',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'usersphotos',
          key: 'id',
        },
      },
    },
    {
      tableName: 'albums',
      timestamps: true,
      underscored: true,
    },
  );

  return Album;
};
