module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('files', 'deleted', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('files', 'deleted');
  }
};
