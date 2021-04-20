module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('albums', 'created_at', { type: Sequelize.DATE });
    await queryInterface.addColumn('albums', 'updated_at', { type: Sequelize.DATE });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('albums', 'created_at');
    await queryInterface.removeColumn('albums', 'updated_at');
  }
};
