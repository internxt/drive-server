import { Sequelize, DataTypes, ModelDefined } from 'sequelize';

interface PermissionsAttributes {
  id: string;
  type: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PermissionModel = ModelDefined<
  PermissionsAttributes, 
  PermissionsAttributes
>;

export default (database: Sequelize): PermissionModel => {
  const Permissions: PermissionModel = database.define(
    'permissions',
    {
      id: {
        type: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.UUIDV4,
        allowNull: false,
      },
    },
    {
      tableName: 'permissions',
      underscored: true,
      timestamps: true
    },
  );

  return Permissions;
};
