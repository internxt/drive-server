module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('shares', 'views', {
      type: Sequelize.INTEGER,
      defaultValue: 1
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('shares', 'views');
  }
};
