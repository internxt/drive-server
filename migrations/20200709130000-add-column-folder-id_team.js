// Filename max length on windows/unix is 255
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('folders', 'id_team', { type: Sequelize.INTEGER });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('folders', 'id_team');
  }
};
