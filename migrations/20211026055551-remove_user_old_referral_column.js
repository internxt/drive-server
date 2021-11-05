module.exports = {
  up: async (queryInterface) => {
    return queryInterface.removeColumn('users', 'referral');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'referral', { type: Sequelize.STRING, defaultValue: null });
  }
};
