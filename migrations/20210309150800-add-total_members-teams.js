module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('teams', 'total_members', { type: Sequelize.INTEGER });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('teams', 'total_members');
  }
};
