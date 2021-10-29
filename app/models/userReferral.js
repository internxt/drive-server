module.exports = (sequelize, DataTypes) => {
  const UserReferral = sequelize.define('users_referrals', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      reference: {
        model: 'users',
        key: 'id'
      }
    },
    referral_id: {
      type: DataTypes.INTEGER,
      reference: {
        model: 'referrals',
        key: 'id'
      }
    },
    referred: {
      type: DataTypes.STRING,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expiration_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    applied: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    timestamps: true,
    underscored: true
  });

  UserReferral.associate = (models) => {
    UserReferral.belongsTo(models.users, { foreignKey: 'user_id', targetKey: 'id' });
    UserReferral.hasOne(models.referrals, { foreignKey: 'referral_id' });
  };

  return UserReferral;
};
