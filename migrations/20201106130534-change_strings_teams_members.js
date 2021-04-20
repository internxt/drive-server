module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('teamsmembers', 'bridge_password', {
      type: Sequelize.STRING(528)
    });
    await queryInterface.changeColumn('teamsmembers', 'bridge_mnemonic', {
      type: Sequelize.STRING(428)
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('teamsmembers', 'bridge_password', { type: Sequelize.STRING });
    await queryInterface.changeColumn('teamsmembers', 'bridge_mnemonic', { type: Sequelize.STRING });
  }
};
