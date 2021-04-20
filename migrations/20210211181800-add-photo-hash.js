module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('photos', 'hash', { type: Sequelize.STRING });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('photos', 'hash');
  }
};
