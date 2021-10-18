import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface AppSumoAttributes {
  id: number
  userId: number
  planId: string
  uuid: string
  invoiceItemUuid: string
}

export function addAppSumoModel(database: Sequelize): ModelDefined<AppSumoAttributes, AppSumoAttributes> {
  const UserPhotos: ModelDefined<AppSumoAttributes, AppSumoAttributes> = database.define(
    'AppSumo',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      planId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      uuid: {
        type: DataTypes.STRING(36),
        allowNull: false
      },
      invoiceItemUuid: {
        type: DataTypes.STRING(36),
        allowNull: false
      }
    },
    {
      timestamps: true,
      underscored: true,
      tableName: 'appsumo'
    }
  );

  UserPhotos.belongsTo(models.users, { foreignKey: 'userId' });
  UserPhotos.hasMany(models.photos, { foreignKey: 'userId' });

  return UserPhotos;
};