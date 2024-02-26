import { DataTypes, ModelDefined, Sequelize } from 'sequelize';

export interface TierAttributes {
  id: string;
  label: string;
  context?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TierModel = ModelDefined<TierAttributes, TierAttributes>;

export default (database: Sequelize): TierModel => {
  const Tier: TierModel = database.define(
    'tiers',
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
      context: {
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
      tableName: 'tiers',
      timestamps: true,
      underscored: true,
    },
  );

  return Tier;
};
