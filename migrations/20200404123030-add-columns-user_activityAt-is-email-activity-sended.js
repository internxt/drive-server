module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'is_email_activity_sended', { type: Sequelize.BOOLEAN, defaultValue: false });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'is_email_activity_sended');
  }
};
