module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('files', 'size', { type: Sequelize.BIGINT.UNSIGNED });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('files', 'size', { type: Sequelize.INTEGER });
  }
};
