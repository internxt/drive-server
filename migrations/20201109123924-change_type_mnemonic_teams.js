module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('teams', 'bridge_mnemonic', { type: Sequelize.STRING(900) });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('teams', 'bridge_mnemonic', { type: Sequelize.STRING });
  }
};
