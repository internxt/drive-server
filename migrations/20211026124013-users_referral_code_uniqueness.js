module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('users', 'referral_code', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('users', 'referral_code', {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true
    });
  }
};
