module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('teams', 'quantity', 'total_members'),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('teams', 'quantity', 'total_members')
    ]);
  }
};
