module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('shares', 'is_folder', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('shares', 'is_folder');
  }
};
