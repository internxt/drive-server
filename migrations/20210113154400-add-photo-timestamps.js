module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('photos', 'created_at', { type: Sequelize.DATE }),
      queryInterface.addColumn('photos', 'updated_at', { type: Sequelize.DATE })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('photos', 'created_at'),
      queryInterface.removeColumn('photos', 'updated_at')
    ]);
  }
};
