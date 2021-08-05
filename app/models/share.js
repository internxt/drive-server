module.exports = (sequelize, DataTypes) => {
  const Share = sequelize.define('shares', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    token: {
      type: DataTypes.DECIMAL(10, 2),
      unique: true
    },
    user: DataTypes.INTEGER,
    file: DataTypes.STRING(24),
    encryptionKey: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    bucket: {
      type: DataTypes.STRING(24),
      allowNull: false
    },
    fileToken: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    mnemonic: DataTypes.STRING,
    isFolder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    underscored: true,
    timestamps: false
  });

  Share.associate = (models) => {
    Share.hasOne(models.file, { as: 'fileInfo', foreignKey: 'fileId', sourceKey: 'file' });
  };

  return Share;
};
