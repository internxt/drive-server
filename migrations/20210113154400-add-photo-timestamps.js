module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('photos', 'updated_at', { type: Sequelize.DATE })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('photos', 'updated_at')
    ]);
  }
};
