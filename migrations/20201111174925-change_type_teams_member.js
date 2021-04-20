module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('teamsmembers', 'bridge_password', { type: Sequelize.STRING(2000) });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('teamsmembers', 'bridge_password', { type: Sequelize.STRING });
  }
};
