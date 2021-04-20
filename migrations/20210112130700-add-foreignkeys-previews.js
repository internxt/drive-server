module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('previews', 'preview_id', {
      type: Sequelize.STRING(24)
    });
    await queryInterface.addColumn('previews', 'photo_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'photos',
        key: 'id'
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('previews', 'preview_id');
    await queryInterface.removeColumn('previews', 'photo_id');
  }
};
