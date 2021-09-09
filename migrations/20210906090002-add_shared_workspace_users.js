module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'shared_workspace', { type: Sequelize.BOOLEAN, defaultValue: false });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'shared_workspace');
  }
};
