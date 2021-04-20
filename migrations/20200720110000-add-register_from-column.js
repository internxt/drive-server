module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('statistics', 'action', { type: Sequelize.STRING(40) });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('statistics', 'action');
  }
};
