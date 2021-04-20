module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('teamsinvitations', 'bridge_password', { type: Sequelize.STRING(2000) });
    await queryInterface.addColumn('teamsinvitations', 'mnemonic', { type: Sequelize.STRING(2000) });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('teamsinvitations', 'bridge_password');
    await queryInterface.removeColumn('teamsinvitations', 'mnemonic');
  }
};
