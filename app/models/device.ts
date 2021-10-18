import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface DeviceAttributes {
  id: number
  mac: string
  userId: number
  name: string
  createdAt: string
  platform: string
}

type DeviceModel = ModelDefined<DeviceAttributes, DeviceAttributes>;

const create = (database: Sequelize): ModelDefined<DeviceAttributes, DeviceAttributes> => {
  const Device: ModelDefined<DeviceAttributes, DeviceAttributes> = database.define(
    'device',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      mac: {
        type: DataTypes.STRING,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER
      },
      name: {
        type: DataTypes.STRING
      },
      created_at: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('createdAt');
        }
      },
      platform: {
        type: DataTypes.STRING(20),
        allowNull: true
      }
    },
    {
      timestamps: true,
      indexes: [{ fields: ['userId', 'mac'], name: 'mac_device_index' }]
    }
  );

  Device.belongsTo(models.users, { foreignKey: 'userId' });
  Device.hasMany(models.backup, { foreignKey: 'userId' });

  return Device;
}

export { create as default, DeviceModel };
