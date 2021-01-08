module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('users', 'welcome_pack', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      })
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('users', 'welcome_pack')
    ]);
  }
};
