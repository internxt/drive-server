module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('usersphotos', 'created_at', { type: Sequelize.DATE }),
      queryInterface.addColumn('usersphotos', 'updated_at', { type: Sequelize.DATE })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('usersphotos', 'created_at'),
      queryInterface.removeColumn('usersphotos', 'updated_at')
    ]);
  }
};