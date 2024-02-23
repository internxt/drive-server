import { DataTypes, ModelDefined, Sequelize } from 'sequelize';

export interface TierLimitsAttributes {
  id: string;
  tierId: string;
  limitId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TierLimitsModel = ModelDefined<TierLimitsAttributes, TierLimitsAttributes>;

export default (database: Sequelize): TierLimitsModel => {
  const TierLimits: TierLimitsModel = database.define(
    'tierLimits',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      tierId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      limitId: {
        type: DataTypes.UUID,
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
      tableName: 'tiers_limits',
      timestamps: true,
      underscored: true,
    },
  );

  return TierLimits;
};
