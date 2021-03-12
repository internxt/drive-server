module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('photosalbums', {
      photo_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'photos',
          key: 'id'
        }
      },
      album_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'albums',
          key: 'id'
        }
      }
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('photosalbums');
  }
};