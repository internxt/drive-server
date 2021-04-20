module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('photosalbums', 'created_at', { type: Sequelize.DATE });
    await queryInterface.addColumn('photosalbums', 'updated_at', { type: Sequelize.DATE });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('photosalbums', 'created_at');
    await queryInterface.removeColumn('photosalbums', 'updated_at');
  }
};
