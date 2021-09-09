module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'username', {
      type: Sequelize.STRING,
      unique: true
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('users', 'username');
  }
};
