module.exports = (sequelize, DataTypes) => {
  const keyserver = sequelize.define('keyserver',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: false
      },
      public_key: {
        type: DataTypes.STRING(920),
        allowNull: false
      },
      private_key: {
        type: DataTypes.STRING(1356),
        allowNull: false
      },
      revocation_key: {
        type: DataTypes.STRING(476),
        allowNull: false
      },
      encrypt_version: {
        type: DataTypes.STRING
      }
    },
    {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    });

  return keyserver;
};
