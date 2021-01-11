// Filename max length on windows/unix is 255
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('files', 'encrypt_version', { type: Sequelize.STRING(20) }),
      queryInterface.addColumn('folders', 'encrypt_version', { type: Sequelize.STRING(20) })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('files', 'encrypt_version'),
      queryInterface.removeColumn('folders', 'encrypt_version')
    ]);
  }
};
