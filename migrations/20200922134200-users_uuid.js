module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'uuid', {
      unique: true,
      type: Sequelize.STRING(36)
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'uuid');
  }
};
