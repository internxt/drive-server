module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('coupons', {
      code: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING
      },
      times_reedemed: {
        type: Sequelize.INTEGER
      }
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('coupons');
  }
};
