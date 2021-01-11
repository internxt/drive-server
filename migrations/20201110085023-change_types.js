module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('teamsmembers', 'bridge_mnemonic', {
        type: Sequelize.STRING(2000)
      }),
      queryInterface.changeColumn('teams', 'bridge_mnemonic', {
        type: Sequelize.STRING(2000)
      })

    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([

      queryInterface.changeColumn('teamsmembers', 'bridge_mnemonic', { type: Sequelize.STRING }),
      queryInterface.changeColumn('teams', 'bridge_mnemonic', { type: Sequelize.STRING })
    ]);
  }
};
