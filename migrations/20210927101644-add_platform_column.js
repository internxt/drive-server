module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('devices', 'platform', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('devices', 'platform');
  }
};
