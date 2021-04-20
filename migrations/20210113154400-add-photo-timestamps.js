module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('photos', 'created_at', { type: Sequelize.DATE });
    await queryInterface.addColumn('photos', 'updated_at', { type: Sequelize.DATE });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('photos', 'created_at');
    await queryInterface.removeColumn('photos', 'updated_at');
  }
};
