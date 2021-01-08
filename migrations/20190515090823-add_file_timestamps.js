module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('files', 'created_at', { type: Sequelize.DATE }),
      queryInterface.addColumn('files', 'updated_at', { type: Sequelize.DATE })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('files', 'created_at'),
      queryInterface.removeColumn('files', 'updated_at')
    ]);
  }
};
