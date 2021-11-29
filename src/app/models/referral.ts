import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

export interface ReferralAttributes {
  id: number;
  key: string;
  type: 'storage';
  credit: number;
  steps: number;
  enabled: boolean;
}

export type ReferralModel = ModelDefined<ReferralAttributes, ReferralAttributes>;

export default (database: Sequelize): ReferralModel => {
  const Referral: ReferralModel = database.define(
    'referrals',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      key: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('storage'),
        allowNull: false,
      },
      credit: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      steps: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'referrals',
      timestamps: true,
      underscored: true,
    },
  );

  return Referral;
};
