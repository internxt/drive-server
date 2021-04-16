module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('photos', 'creation_time', {
        type: Sequelize.DATE,
        allowNull: false,
      }),
      queryInterface.addColumn('photos', 'device', { type: Sequelize.STRING(10) })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('photos', 'creation_time'),
      queryInterface.removeColumn('photos', 'device')
    ]);
  }
};