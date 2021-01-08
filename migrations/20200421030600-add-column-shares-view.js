module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('shares', 'views', {
        type: Sequelize.INTEGER,
        defaultValue: 1
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([queryInterface.removeColumn('shares', 'views')]);
  }
};
