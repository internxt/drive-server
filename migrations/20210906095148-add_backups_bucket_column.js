module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'backups_bucket', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'backups_bucket');
  }
};
