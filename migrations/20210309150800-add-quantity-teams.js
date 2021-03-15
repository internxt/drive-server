module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('teams', 'quantity', { type: Sequelize.INTEGER })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('teams', 'quantity')
    ]);
  }
};