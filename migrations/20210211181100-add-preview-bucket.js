module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('previews', 'bucket_id', { type: Sequelize.STRING(24) })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('previews', 'bucket_id')
    ]);
  }
};