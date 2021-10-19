module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('files', 'modification_time', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now')
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('files', 'modification_time');
  }
};
