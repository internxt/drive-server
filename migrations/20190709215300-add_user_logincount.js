module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'errorLoginCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'errorLoginCount');
  }
};
