// Filename max length on windows/unix is 255
// Encrypted filenames of 255 chars is 512
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('files', 'name', { type: Sequelize.STRING(512) });
    await queryInterface.changeColumn('folders', 'name', { type: Sequelize.STRING(512) });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('files', 'name', { type: Sequelize.STRING });
    await queryInterface.changeColumn('folders', 'name', { type: Sequelize.STRING });
  }
};
