module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('previews', 'bucket_id', { type: Sequelize.STRING(24) });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('previews', 'bucket_id');
  }
};
