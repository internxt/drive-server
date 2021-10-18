import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface FolderAttributes {
  id: number
  parentId: number
  name: string
  bucket: string
  userId: number
  encryptVersion: string
}

type FolderModel = ModelDefined<FolderAttributes, FolderAttributes>;

const create = (database: Sequelize): FolderModel => {
  const Folder: FolderModel = database.define(
    'folder',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      parentId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'folders',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING
      },
      bucket: {
        type: DataTypes.STRING(24)
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      encrypt_version: {
        type: DataTypes.STRING
      }
    },
    {
      timestamps: true,
      underscored: true,
      indexes: [{ name: 'name', fields: ['name'] }]
    }
  );

  Folder.hasMany(models.file);
  Folder.belongsTo(models.users);
  Folder.hasMany(models.folder, {
    foreignKey: 'parent_id',
    as: 'children'
  });

  return Folder;
}

export { create as default, FolderModel };
