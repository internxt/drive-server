import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

export interface Attributes {
  id: number;
  fileId: string;
  userId: number;
  folderId: string;
  bucket: string;
}

export type DeletedFileModel = ModelDefined<Attributes, Attributes>;

export default (database: Sequelize): DeletedFileModel => {
  const DeletedFile: DeletedFileModel = database.define(
    'deleted_files',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      fileId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      folderId: {
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false
      },
      bucket: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'deleted_files',
      underscored: true,
      timestamps: false,
    },
  );

  return DeletedFile;
};
