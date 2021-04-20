module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('usersphotos', 'created_at', { type: Sequelize.DATE });
    await queryInterface.addColumn('usersphotos', 'updated_at', { type: Sequelize.DATE });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('usersphotos', 'created_at');
    await queryInterface.removeColumn('usersphotos', 'updated_at');
  }
};
