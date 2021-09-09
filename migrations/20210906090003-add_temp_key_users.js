module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'temp_key', { type: Sequelize.STRING(256) });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'temp_key');
  }
};
