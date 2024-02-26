import { DataTypes, ModelDefined, Sequelize } from 'sequelize';

export interface LimitAttributes {
  id: string;
  label: string;
  type: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export type LimitModel = ModelDefined<LimitAttributes, LimitAttributes>;

export default (database: Sequelize): LimitModel => {
  const Limit: LimitModel = database.define(
    'limits',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      label: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      value: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'limits',
      timestamps: true,
      underscored: true,
    },
  );

  return Limit;
};
