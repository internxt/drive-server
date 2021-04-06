module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('previews', 'preview_id', {
        type: Sequelize.STRING(24)
      }),
      queryInterface.addColumn('previews', 'photo_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'photos',
          key: 'id'
        }
      })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('previews', 'preview_id'),
      queryInterface.removeColumn('previews', 'photo_id')
    ]);
  }
};
