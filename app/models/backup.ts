import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface BackupAttributes {
  id: number
  userId: number
  planId: string
  uuid: string
  invoiceItemUuid: string
}

export function addBackupModel(database: Sequelize): ModelDefined<BackupAttributes, BackupAttributes> {
  const Backup: ModelDefined<BackupAttributes, BackupAttributes> = database.define(
    'backup',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      path: {
        type: DataTypes.TEXT
      },
      fileId: {
        type: DataTypes.STRING(24)
      },
      deviceId: {
        type: DataTypes.INTEGER
      },
      userId: {
        type: DataTypes.INTEGER
      },
      hash: {
        type: DataTypes.STRING
      },
      interval: {
        type: DataTypes.INTEGER
      },
      size: {
        type: DataTypes.BIGINT.UNSIGNED
      },
      bucket: {
        type: DataTypes.STRING(24)
      },
      lastBackupAt: {
        type: DataTypes.DATE
      },
      enabled: {
        type: DataTypes.BOOLEAN
      },
      // TODO: Is this required?
      created_at: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('createdAt');
        }
      },
      encrypt_version: {
        type: DataTypes.STRING
      }
    },
    {
      timestamps: true
    }
  );

  Backup.belongsTo(models.device, { foreignKey: 'userId' });
  Backup.belongsTo(models.users, { foreignKey: 'userId' });

  return Backup;
}
