module.exports = (sequelize, DataTypes) => {
  const Share = sequelize.define('shares', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    token: DataTypes.DECIMAL(10, 2),
    user: DataTypes.INTEGER,
    file: DataTypes.STRING(24),
    mnemonic: DataTypes.STRING,
    is_folder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    timestamps: false
  });

  return Share;
};
