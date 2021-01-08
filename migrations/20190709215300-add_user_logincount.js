module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('users', 'errorLoginCount', {
        type: Sequelize.INTEGER,
        defaultValue: 0
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('users', 'errorLoginCount')
    ]);
  }
};
