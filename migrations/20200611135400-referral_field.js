module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'referral', { type: Sequelize.STRING, defaultValue: null });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'referral');
  }
};
