// Filename max length on windows/unix is 255
// Encrypted filenames of 255 chars is 512
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('files', 'name', {
        type: Sequelize.STRING(512)
      }),
      queryInterface.changeColumn('folders', 'name', {
        type: Sequelize.STRING(512)
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('files', 'name', { type: Sequelize.STRING }),
      queryInterface.changeColumn('folders', 'name', {
        type: Sequelize.STRING
      })
    ]);
  }
};
