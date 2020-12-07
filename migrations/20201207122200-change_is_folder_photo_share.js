module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('photo_shares', 'is_folder', 'is_album'),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('photo_shares', 'is_album', 'is_folder'),
    ]);
  },
};