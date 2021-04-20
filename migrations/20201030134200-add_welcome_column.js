module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'welcome_pack', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'welcome_pack');
  }
};
