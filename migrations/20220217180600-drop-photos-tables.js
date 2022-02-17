module.exports = {
  up: async (queryInterface) => {
    await queryInterface.dropTable('previews');
    await queryInterface.dropTable('photosalbums');
    await queryInterface.dropTable('albums');
    await queryInterface.dropTable('photos');
    await queryInterface.dropTable('usersphotos');
  },

  down: async () => {
    // Nothing to do
  }
};
