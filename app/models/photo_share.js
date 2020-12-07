module.exports = (sequelize, DataTypes) => {
  const photo_share = sequelize.define(
    'photo_shares',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      token: DataTypes.DECIMAL(10, 2),
      user_id: DataTypes.INTEGER,
      photo: DataTypes.STRING(24),
      mnemonic: DataTypes.STRING,
      is_folder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      views: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      timestamps: false,
    }
  );

  Share.associate = function (models) {
    // associations can be defined here
  };

  return photo_share;
};