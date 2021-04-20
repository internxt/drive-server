module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('photos', 'creation_time', {
      type: Sequelize.DATE,
      allowNull: false
    });
    await queryInterface.addColumn('photos', 'device', { type: Sequelize.STRING(10) });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('photos', 'creation_time');
    await queryInterface.removeColumn('photos', 'device');
  }
};
