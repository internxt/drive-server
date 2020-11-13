module.exports = {
    up: (queryInterface, Sequelize) => {
      return Promise.all([
        queryInterface.addColumn('team_invitations', 'bridge_password', {
          type: Sequelize.STRING(2000),
        }),
        queryInterface.addColumn('team_invitations', 'mnemonic', {
            type: Sequelize.STRING(2000),
          }),
      ]);
    },
  
    down: (queryInterface, Sequelize) => {
      return Promise.all([
          queryInterface.removeColumn('team_invitations', 'bridge_password'),
          queryInterface.removeColumn('team_invitations', 'mnemonic')
        ]);
    },
  };