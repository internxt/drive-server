import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

export interface ThumbnailAttributes {
  id: number;
  file_id: number;
  type: string;
  size: number;
  bucket_id: string;
  bucket_file: string;
  encrypt_version: string;
  created_at: Date;
  updated_at: Date;
}

export type ThumbnailModel = ModelDefined<ThumbnailAttributes, ThumbnailAttributes>;

export default (database: Sequelize): ThumbnailModel => {
  const Thumbnail: ThumbnailModel = database.define(
    'thumbnail',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      file_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      max_width: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      max_height: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      size: {
        type: DataTypes.BIGINT.UNSIGNED
      },
      bucket_id: {
        type: DataTypes.STRING(24)
      },
      bucket_file: {
        type: DataTypes.STRING(24)
      },
      encrypt_version: {
        type: DataTypes.STRING(20)
      },
      created_at: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('created_at');
        },
      },
      updated_at: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('updated_at');
        },
      },
    },
    {
      timestamps: true,
      underscored: true,
    },
  );

  return Thumbnail;
};
