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
    isFolder: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: false
  });

  Share.associate = function (models) {
    // associations can be defined here
  };

  return Share
};
