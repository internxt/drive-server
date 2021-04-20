module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('statistics', 'action', { type: Sequelize.STRING(40) });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('statistics', 'action');
  }
};
