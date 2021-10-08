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
        type: DataTypes.ENUM('subscription', 'one_time')
      },
      createdAt: {
        type: DataTypes.DATE
      },
      updatedAt: {
        type: DataTypes.DATE
      },
      limit: {
        type: DataTypes.INTEGER
      }
    },
    {
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: false,
          fields: ['name']
        }
      ]
    }
  );

  plan.associate = (models) => {
    plan.belongsTo(models.users);
  };

  return plan;
};
