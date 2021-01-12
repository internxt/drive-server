module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('usersphotos', 'root_album_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'albums',
          key: 'id'
        }
      }),
      queryInterface.addColumn('usersphotos', 'root_preview_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'previews',
          key: 'id'
        }
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
