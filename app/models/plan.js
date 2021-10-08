module.exports = (sequelize, DataTypes) => {
  const plan = sequelize.define(
    'plan',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        reference: {
          model: 'users',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING
      },
      type: {
        type: Sequelize.ENUM('subscription', 'one_time')
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      },
      limit: {
        type: DataTypes.INTEGER
      }
    },
    {
      timestamps: true,
      underscored: true
    }
  );

  plan.associate = (models) => {
    plan.belongsTo(models.users);
  };

  return plan;
};
