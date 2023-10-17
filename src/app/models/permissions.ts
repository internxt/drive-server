import { Sequelize, DataTypes, ModelDefined } from 'sequelize';

interface PermissionsAttributes {
  id: string;
  name: string;
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.UUIDV4,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        }
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
