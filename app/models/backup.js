module.exports = (sequelize, DataTypes) => {
  const backup = sequelize.define(
    'backup',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      path: {
        type: DataTypes.TEXT,
      },
      fileId: {
        type: DataTypes.STRING(24),
      },
      deviceId: {
        type: DataTypes.INTEGER,
      },
      userId: {
        type: DataTypes.INTEGER,
      },
      hash: {
        type: DataTypes.STRING,
      },
      interval: {
        type: DataTypes.INTEGER,
      },
      size: {
        type: DataTypes.BIGINT.UNSIGNED,
      },
      bucket: {
        type: DataTypes.STRING(24),
      },
      lastBackupAt: {
        type: DataTypes.DATE,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
      },
      created_at: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('createdAt');
        },
      },
      encrypt_version: {
        type: DataTypes.STRING,
      },
    },
    {
      timestamps: true,
    }
  );

  backup.associate = (models) => {
    backup.belongsTo(models.device);
    backup.belongsTo(models.users);
  };

  return backup;
};
