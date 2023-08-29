import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface RoleAttributes {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RoleModel = ModelDefined<
  RoleAttributes,
  RoleAttributes
>;

export default (database: Sequelize): RoleModel => {
  const Roles: RoleModel = database.define(
    'roles',
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
    },
    {
      tableName: 'roles',
      underscored: true,
      timestamps: true
    },
  );

  return Roles;
};
