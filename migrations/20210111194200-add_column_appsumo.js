module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('users', 'register_completed', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      })
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('users', 'register_completed')
    ]);
  }
};
