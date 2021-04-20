module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('folders', 'created_at', {
      type: Sequelize.DATE
    });
    await queryInterface.addColumn('folders', 'updated_at', {
      type: Sequelize.DATE
    });
    await queryInterface.addColumn('users', 'created_at', { type: Sequelize.DATE });
    await queryInterface.addColumn('users', 'updated_at', { type: Sequelize.DATE });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('folders', 'created_at');
    await queryInterface.removeColumn('folders', 'updated_at');
    await queryInterface.removeColumn('users', 'created_at');
    await queryInterface.removeColumn('users', 'updated_at');
  }
};
