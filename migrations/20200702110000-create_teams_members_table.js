module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('teamsmembers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      id_team: {
        type: Sequelize.STRING
      },
      user: {
        type: Sequelize.STRING
      },
      is_active: {
        type: Sequelize.BOOLEAN
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('teamsmembers');
  }
};
