module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'last_resend', Sequelize.DATE);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([queryInterface.removeColumn('users', 'last_resend')]);
  }
};
