module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('teams', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      user: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      bridge_user: {
        type: Sequelize.STRING
      },
      bridge_password: {
        type: Sequelize.STRING
      },
      bridge_email: {
        type: Sequelize.STRING
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('teams');
  }
};
