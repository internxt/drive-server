module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'users',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.STRING(60),
      },
      name: {
        type: DataTypes.STRING,
      },
      lastname: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
      },
      mnemonic: {
        type: DataTypes.STRING,
      },
      storeMnemonic: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      root_folder_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'folders',
          key: 'id',
        },
      },
      isFreeTier: {
        type: DataTypes.BOOLEAN,
      },
      isCreated: {
        type: DataTypes.VIRTUAL,
      },
      hKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      secret_2FA: {
        type: DataTypes.STRING,
      },
      errorLoginCount: {
        type: DataTypes.INTEGER,
      },
      is_email_activity_sended: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: false,
      },
      referral: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      timestamps: true,
      underscored: true,
    },
    {
      defaultScope: {
        attributes: { exclude: ['userId'] },
      },
    }
  );

  User.associate = function (models) {
    User.hasMany(models.folder);
  };

  return User;
};
