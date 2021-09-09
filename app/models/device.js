module.exports = (sequelize, DataTypes) => {
  const device = sequelize.define('device',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
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
      timestamps: true
    });

  device.associate = (models) => {
    device.belongsTo(models.users);
    device.hasMany(models.backup);
  };

  return device;
};
