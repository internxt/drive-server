module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('usersphotos', 'root_album_id', {
      type: Sequelize.STRING(24)
    });
    await queryInterface.addColumn('usersphotos', 'root_preview_id', {
      type: Sequelize.STRING(24)
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('usersphotos', 'root_album_id');
    await queryInterface.removeColumn('usersphotos', 'root_preview_id');
  }
};
