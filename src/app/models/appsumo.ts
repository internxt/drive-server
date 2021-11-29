import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface AppSumoAttributes {
  id: number;
  userId: number;
  planId: string;
  uuid: string;
  invoiceItemUuid: string;
}

export type AppSumoModel = ModelDefined<AppSumoAttributes, AppSumoAttributes>;

export default (database: Sequelize): AppSumoModel => {
  const AppSumo: AppSumoModel = database.define(
    'AppSumo',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      planId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      uuid: {
        type: DataTypes.STRING(36),
        allowNull: false,
      },
      invoiceItemUuid: {
        type: DataTypes.STRING(36),
        allowNull: false,
      },
    },
    {
      timestamps: true,
      underscored: true,
      tableName: 'appsumo',
    },
  );

  return AppSumo;
};
