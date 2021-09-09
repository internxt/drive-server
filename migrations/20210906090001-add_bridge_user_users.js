module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'bridge_user', {
      type: Sequelize.STRING
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('users', 'bridge_user');
  }
};
