module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('photosalbums', 'created_at', { type: Sequelize.DATE }),
      queryInterface.addColumn('photosalbums', 'updated_at', { type: Sequelize.DATE })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('photosalbums', 'created_at'),
      queryInterface.removeColumn('photosalbums', 'updated_at')
    ]);
  }
};