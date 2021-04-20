module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('previews', 'hash', { type: Sequelize.STRING });
    await queryInterface.addColumn('previews', 'created_at', { type: Sequelize.DATE });
    await queryInterface.addColumn('previews', 'updated_at', { type: Sequelize.DATE });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('previews', 'hash');
    await queryInterface.removeColumn('previews', 'created_at');
    await queryInterface.removeColumn('previews', 'updated_at');
  }
};
