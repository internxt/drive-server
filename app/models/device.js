module.exports = (sequelize, DataTypes) => {
  const device = sequelize.define('device',
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
      }
    },
    {
      timestamps: true,
      indexes: [{ fields: ['userId', 'mac'], name: 'mac_device_index' }]
    });

  device.associate = (models) => {
    device.belongsTo(models.users);
    device.hasMany(models.backup);
  };

  return device;
};
