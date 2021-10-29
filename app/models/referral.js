module.exports = (sequelize, DataTypes) => {
  const Referral = sequelize.define('referrals', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('storage'),
      allowNull: false
    },
    credit: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    steps: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    timestamps: true,
    underscored: true
  });

  Referral.associate = (models) => {
    Referral.hasMany(models.users_referrals);
  };

  return Referral;
};
