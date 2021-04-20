module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('folders', 'id_team');
    return queryInterface.removeColumn('users', 'is_free_tier');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('folders', 'id_team', { type: Sequelize.INTEGER });
    await queryInterface.addColumn('users', 'is_free_tier', { type: Sequelize.BOOLEAN });
  }
};
