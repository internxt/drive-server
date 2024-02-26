import { DataTypes, ModelDefined, Sequelize } from 'sequelize';

export interface PaidPlansAttributes {
  id: string;
  planId: string;
  tierId: string;
  createdAt: Date;
}

export type PaidPlansModel = ModelDefined<PaidPlansAttributes, PaidPlansAttributes>;

export default (database: Sequelize): PaidPlansModel => {
  const PaidPlans: PaidPlansModel = database.define(
    'paidPlans',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      planId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tierId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'paid_plans',
      timestamps: true,
      underscored: true,
    },
  );

  return PaidPlans;
};
