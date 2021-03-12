module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('previews', 'hash', { type: Sequelize.STRING }),
      queryInterface.addColumn('previews', 'created_at', { type: Sequelize.DATE }),
      queryInterface.addColumn('previews', 'updated_at', { type: Sequelize.DATE })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('previews', 'hash'),
      queryInterface.removeColumn('previews', 'created_at'),
      queryInterface.removeColumn('previews', 'updated_at')
    ]);
  }
};
