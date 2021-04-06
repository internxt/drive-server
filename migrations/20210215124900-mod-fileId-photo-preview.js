module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('photos', 'photo_id', 'file_id'),
      queryInterface.renameColumn('previews', 'preview_id', 'file_id')
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('photos', 'file_id', 'photo_id'),
      queryInterface.renameColumn('previews', 'file_id', 'preview_id')
    ]);
  }
};
