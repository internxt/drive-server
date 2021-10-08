'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
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
          type: Sequelize.INTEGER
        }
      }, { transaction });

      await queryInterface.addIndex('plans', ['name'], { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }    
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('plans');
  }
};
