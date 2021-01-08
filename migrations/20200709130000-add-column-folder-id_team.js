// Filename max length on windows/unix is 255
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('folders', 'id_team', { type: Sequelize.INTEGER })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('folders', 'id_team')
    ]);
  }
};
