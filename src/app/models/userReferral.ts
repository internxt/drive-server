import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface Attributes {
  id: number;
  key: string;
  type: 'storage';
  credit: number;
  steps: number;
  enabled: boolean;
}

export type UserReferralModel = ModelDefined<Attributes, Attributes>;

export default (database: Sequelize): UserReferralModel => {
  const UserReferral: UserReferralModel = database.define(
    'users_referrals',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      referral_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'referrals',
          key: 'id',
        },
      },
      referred: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expiration_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      applied: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'users_referrals',
      timestamps: true,
      underscored: true,
    },
  );

  return UserReferral;
};
