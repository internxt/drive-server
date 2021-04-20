module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'storeMnemonic', {
      type: Sequelize.BOOLEAN,
      allowNull: true
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'storeMnemonic');
  }
};
