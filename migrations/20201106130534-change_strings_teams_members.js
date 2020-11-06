module.exports = {
    up: (queryInterface, Sequelize) => {
      return Promise.all([
        queryInterface.changeColumn('teams_members', 'bridge_password', {
            type: Sequelize.STRING(528),
          }),
          queryInterface.changeColumn('teams_members', 'bridge_mnemonic', {
            type: Sequelize.STRING(428),
          }),
      ]);
    },
  
    down: (queryInterface, Sequelize) => {
      return Promise.all([
        queryInterface.changeColumn('teams_members', 'bridge_password', { type: Sequelize.STRING }),
        queryInterface.changeColumn('teams_members', 'bridge_mnemonic', { type: Sequelize.STRING }),
      ]);
    },
  };
  