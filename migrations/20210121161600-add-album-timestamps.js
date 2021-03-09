module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('albums', 'created_at', { type: Sequelize.DATE }),
      queryInterface.addColumn('albums', 'updated_at', { type: Sequelize.DATE })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('albums', 'created_at'),
      queryInterface.removeColumn('albums', 'updated_at')
    ]);
  }
};