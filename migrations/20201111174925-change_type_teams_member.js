module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('teams_members', 'bridge_password', {
        type: Sequelize.STRING(2000)
      })

    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('teams_members', 'bridge_password', { type: Sequelize.STRING })

    ]);
  }
};
