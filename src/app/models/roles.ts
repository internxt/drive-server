import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface RoleAttributes {
  id: string;
  role: string;
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
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    {
      tableName: 'roles',
      underscored: true,
      timestamps: true
    },
  );

  return Roles;
};

