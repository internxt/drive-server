'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('plans', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.ENUM('subscription', 'one_time')
      },
      created_at: {
        type: Sequelize.DATE
      },
      updated_at: {
        type: Sequelize.DATE
      },
      limit: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      }
    });

    await queryInterface.addIndex('plans', ['name'], {
      name: 'plans_name_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('plans', 'plans_name_idx');
    return queryInterface.dropTable('plans');
  }
};
