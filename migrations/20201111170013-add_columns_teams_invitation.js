module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('teamsinvitations', 'bridge_password', {
        type: Sequelize.STRING(2000)
      }),
      queryInterface.addColumn('teamsinvitations', 'mnemonic', {
        type: Sequelize.STRING(2000)
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('teamsinvitations', 'bridge_password'),
      queryInterface.removeColumn('teamsinvitations', 'mnemonic')
    ]);
  }
};
