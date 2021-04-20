module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'referred', { type: Sequelize.STRING(36) });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'referred');
  }
};
