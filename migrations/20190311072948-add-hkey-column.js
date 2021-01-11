module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'hKey', {
      type: Sequelize.STRING,
      allowNull: false
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'hKey');
  }
};
