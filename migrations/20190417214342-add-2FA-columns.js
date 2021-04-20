module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'secret_2FA', {
      type: Sequelize.STRING(40)
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'secret_2FA');
  }
};
