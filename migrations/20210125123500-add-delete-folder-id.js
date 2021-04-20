module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('usersphotos', 'delete_folder_id', { type: Sequelize.INTEGER });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('usersphotos', 'delete_folder_id');
  }
};
