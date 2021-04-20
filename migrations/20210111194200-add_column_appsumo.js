module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'register_completed', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'register_completed');
  }
};
