module.exports = (sequelize, DataTypes) => {
  const AppSumo = sequelize.define('AppSumo',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      planId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      uuid: {
        type: DataTypes.STRING(36),
        allowNull: false
      },
      invoiceItemUuid: {
        type: DataTypes.STRING(36),
        allowNull: false
      }
    },
    {
      timestamps: true,
      underscored: true,
      tableName: 'appsumo'
    });

  AppSumo.associate = (models) => {
    AppSumo.belongsTo(models.users);
  };

  return AppSumo;
};
