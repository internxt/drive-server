module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('users', 'is_email_activity_sended', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      })
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('users', 'is_email_activity_sended')
    ]);
  }
};
