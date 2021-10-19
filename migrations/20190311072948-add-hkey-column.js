module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'hKey', {
      type: Sequelize.BLOB('medium'),
      allowNull: false
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'hKey');
  }
};
