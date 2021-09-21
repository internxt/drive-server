module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('backups', 'enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    await queryInterface.addColumn('backups', 'lastBackupAt', {
      type: Sequelize.DATE
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('backups', 'enabled');
    await queryInterface.removeColumn('backups', 'lastBackupAt');
  }
};
