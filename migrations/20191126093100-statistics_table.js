module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('statistics', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING
      },
      user: {
        type: Sequelize.STRING
      },
      userAgent: {
        type: Sequelize.STRING
      },
      created_at: {
        type: Sequelize.DATE
      },
      updated_at: {
        type: Sequelize.DATE
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('statistics');
  }
};
