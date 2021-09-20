module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('backups', 'path', {
        type: Sequelize.TEXT,
        allowNull: true,
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('backups', 'path', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
    ]);
  },
};
