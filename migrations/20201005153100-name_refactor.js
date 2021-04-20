module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn('teams', 'bridge_email', 'bridge_mnemonic');
    await queryInterface.renameColumn('teams', 'user', 'admin');
    await queryInterface.removeColumn('teamsinvitations', 'is_used');
    await queryInterface.removeColumn('teamsmembers', 'is_active');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('teamsmembers', 'is_active', {
      type: Sequelize.BOOLEAN
    });
    await queryInterface.addColumn('teamsinvitations', 'is_used', {
      type: Sequelize.BOOLEAN
    });
    await queryInterface.renameColumn('teams', 'admin', 'user');
    await queryInterface.renameColumn('teams', 'bridge_mnemonic', 'bridge_email');
  }
};
