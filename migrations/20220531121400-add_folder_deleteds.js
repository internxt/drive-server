module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('folders', 'deleted', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('folders', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('folders', 'deleted');
    await queryInterface.removeColumn('folders', 'deleted_at');
    return;
  },
};
