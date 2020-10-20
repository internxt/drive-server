module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('teams_members', 'passwordMembers', {
      type: Sequelize.STRING}),
      
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('teams_members', 'passwordMembers', {
        type: Sequelize.BOOLEAN
      }),
      
    ]);
  },
};

