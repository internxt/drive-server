module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('files', 'size', {
        type: Sequelize.BIGINT.UNSIGNED
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('files', 'size', { type: Sequelize.INTEGER })
    ]);
  }
};
