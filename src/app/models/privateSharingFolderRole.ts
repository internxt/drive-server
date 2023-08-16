import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface Attributes {
  id: number;
  userId: string;
  folderId: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PrivateSharingFolderRolesModel = ModelDefined<Attributes, Attributes>;

export default (database: Sequelize): PrivateSharingFolderRolesModel => {
  const PrivateSharingFolderRoles: PrivateSharingFolderRolesModel = database.define(
    'private_sharing_folder_roles',
    {
      id: {
        type: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      folderId: {
        type: DataTypes.UUIDV4,
        allowNull: false
      },
      roleId: {
        type: DataTypes.UUIDV4,
        allowNull: false
      },
    },
    {
      tableName: 'private_sharing_folder_roles',
      underscored: true,
      timestamps: true
    },
  );

  return PrivateSharingFolderRoles;
};

