module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('usersphotos', 'delete_folder_id', { type: Sequelize.INTEGER })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('usersphotos', 'delete_folder_id')
    ]);
  }
};
