module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('teamsmembers', 'bridge_password', {
        type: Sequelize.STRING(528)
      }),
      queryInterface.changeColumn('teamsmembers', 'bridge_mnemonic', {
        type: Sequelize.STRING(428)
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('teamsmembers', 'bridge_password', { type: Sequelize.STRING }),
      queryInterface.changeColumn('teamsmembers', 'bridge_mnemonic', { type: Sequelize.STRING })
    ]);
  }
};
