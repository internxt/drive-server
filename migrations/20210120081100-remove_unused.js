module.exports = {
  up: (queryInterface) => {
    return queryInterface.removeColumn('users', 'referred');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'referred', { type: Sequelize.STRING(36) });
  }
};
