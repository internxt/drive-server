module.exports = {
  up: async (queryInterface) => {
    await queryInterface.dropTable('subscriptions');
    await queryInterface.dropTable('plans');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      price_eur: {
        type: Sequelize.DECIMAL(10, 2)
      },
      space_gb: {
        type: Sequelize.INTEGER
      },
      stripe_plan_id: {
        type: Sequelize.STRING
      }
    });

    await queryInterface.createTable('subscriptions', {
      user: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      plan: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'plans',
          key: 'id'
        }
      },
      creation_time: {
        type: Sequelize.DATE
      },
      stripe_customer_id: {
        type: Sequelize.STRING
      },
      expiration: {
        type: Sequelize.DATE
      },
      is_active: {
        type: Sequelize.BOOLEAN
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  }
};
