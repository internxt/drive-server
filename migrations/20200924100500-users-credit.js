module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'credit', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'credit');
  }
};
