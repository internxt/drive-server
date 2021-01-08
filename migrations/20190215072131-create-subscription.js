module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('subscriptions', {
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('subscriptions');
  }
};

// sequelize model:generate --name subscription --attributes user:integer,plan:integer,creation_time:date,stripe_customer_id:string,expiration:date,is_active:boolean
