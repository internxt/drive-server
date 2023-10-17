import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

export interface SharingRoleAttributes {
  id: string;
  sharingId: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}
export type SharingRolesModel = ModelDefined<SharingRoleAttributes, SharingRoleAttributes>;

export default (database: Sequelize): SharingRolesModel => {
  const SharingRoles: SharingRolesModel = database.define(
    'sharingRoles',
    {
      id: {
        type: DataTypes.UUIDV4,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      sharingId: {
        type: DataTypes.UUIDV4,
        allowNull: false,
        references: {
          model: 'sharings',
          key: 'id'
        },
      },
      roleId: {
        type: DataTypes.UUIDV4,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        }
      },
    },
    {
      tableName: 'sharing_roles',
      underscored: true,
      timestamps: true
    },
  );

  return SharingRoles;
};
