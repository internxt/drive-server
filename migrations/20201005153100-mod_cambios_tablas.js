module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('teams', 'bridge_email', 'bridge_mnemonic'),
      queryInterface.renameColumn('teams', 'user', 'admin'),
      queryInterface.removeColumn('team_invitations', 'is_used'),
      queryInterface.removeColumn('teams_members', 'is_active'),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('teams_members', 'is_active', {
        type: Sequelize.BOOLEAN
      }),
      queryInterface.addColumn('team_invitations', 'is_used', {
        type: Sequelize.BOOLEAN
      }),
      queryInterface.renameColumn('teams', 'admin', 'user'),
      queryInterface.renameColumn('teams', 'bridge_mnemonic', 'bridge_email'),
    ]);
  },
};


