module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('appsumo', {
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
        onDelete: 'CASCADE'
      },
      plan_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      uuid: {
        type: Sequelize.STRING(36),
        allowNull: false
      },
      invoice_item_uuid: {
        type: Sequelize.STRING(36),
        allowNull: false
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
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('appsumo');
  }
};
