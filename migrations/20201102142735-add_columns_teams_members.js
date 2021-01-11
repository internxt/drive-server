module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('teamsmembers', 'bridge_password', {
        type: Sequelize.STRING
      }),
      queryInterface.addColumn('teamsmembers', 'bridge_mnemonic', {
        type: Sequelize.STRING
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('teamsmembers', 'bridge_password'),
      queryInterface.removeColumn('teamsmembers', 'bridge_mnemonic')
    ]);
  }
};
