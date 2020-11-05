module.exports = {
    up: (queryInterface, Sequelize) => {
      return Promise.all([
        queryInterface.addColumn('teams_members', 'bridge_password', {
          type: Sequelize.STRING,
        }),
        queryInterface.addColumn('teams_members', 'bridge_mnemonic', {
            type: Sequelize.STRING,
          }),
      ]);
    },
  
    down: (queryInterface, Sequelize) => {
      return Promise.all([
          queryInterface.removeColumn('teams_members', 'bridge_password'),
          queryInterface.removeColumn('teams_members', 'bridge_mnemonic')
        ]);
    },
  };