module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('usersphotos', 'root_album_id', {
        type: Sequelize.STRING(24)
      }),
      queryInterface.addColumn('usersphotos', 'root_preview_id', {
        type: Sequelize.STRING(24)
      })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('usersphotos', 'root_album_id'),
      queryInterface.removeColumn('usersphotos', 'root_preview_id')
    ]);
  }
};
