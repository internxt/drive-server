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
    referred_id: {
      type: DataTypes.INTEGER,
      reference: {
        model: 'users',
        key: 'id'
      },
      allowNull: true
    },
    current_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    underscored: true
  });

  UserReferral.associate = (models) => {
    UserReferral.belongsTo(models.users, { targetKey: 'user_id' });
    UserReferral.hasOne(models.referrals, { foreignKey: 'referral_id' });
    UserReferral.hasOne(models.users, { foreignKey: 'referred_id' });
  };

  return UserReferral;
};
