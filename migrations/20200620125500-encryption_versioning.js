// Filename max length on windows/unix is 255
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('files', 'encrypt_version', { type: Sequelize.STRING(20) });
    await queryInterface.addColumn('folders', 'encrypt_version', { type: Sequelize.STRING(20) });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('files', 'encrypt_version');
    await queryInterface.removeColumn('folders', 'encrypt_version');
  }
};
