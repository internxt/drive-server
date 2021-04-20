module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('files', 'created_at', { type: Sequelize.DATE });
    await queryInterface.addColumn('files', 'updated_at', { type: Sequelize.DATE });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('files', 'created_at');
    await queryInterface.removeColumn('files', 'updated_at');
  }
};
