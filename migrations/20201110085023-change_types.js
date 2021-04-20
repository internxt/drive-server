module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('teamsmembers', 'bridge_mnemonic', { type: Sequelize.STRING(2000) });
    await queryInterface.changeColumn('teams', 'bridge_mnemonic', { type: Sequelize.STRING(2000) });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('teamsmembers', 'bridge_mnemonic', { type: Sequelize.STRING });
    await queryInterface.changeColumn('teams', 'bridge_mnemonic', { type: Sequelize.STRING });
  }
};
