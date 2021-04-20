module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn('photos', 'photo_id', 'file_id');
    await queryInterface.renameColumn('previews', 'preview_id', 'file_id');
  },

  down: async (queryInterface) => {
    await queryInterface.renameColumn('photos', 'file_id', 'photo_id');
    await queryInterface.renameColumn('previews', 'file_id', 'preview_id');
  }
};
