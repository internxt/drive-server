import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

enum PlanTypes {
  subscription = 'subscription',
  oneTime = 'one_time',
}

interface Attributes {
  id: number;
  userId: number;
  name: string;
  type: PlanTypes;
  createdAt: Date;
  updatedAt: Date;
  limit: number;
}

export type PlanModel = ModelDefined<Attributes, Attributes>;

export default (database: Sequelize): PlanModel => {
  const Plan: PlanModel = database.define(
    'plan',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.ENUM('subscription', 'one_time'),
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
      limit: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'plans',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: false,
          fields: ['name'],
        },
      ],
    },
  );

  return Plan;
};
