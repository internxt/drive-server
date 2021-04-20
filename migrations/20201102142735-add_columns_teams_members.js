module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('teamsmembers', 'bridge_password', { type: Sequelize.STRING });
    await queryInterface.addColumn('teamsmembers', 'bridge_mnemonic', { type: Sequelize.STRING });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('teamsmembers', 'bridge_password');
    await queryInterface.removeColumn('teamsmembers', 'bridge_mnemonic');
  }
};
