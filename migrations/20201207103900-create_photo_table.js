module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('photos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      photo_id: {
        type: Sequelize.STRING(24)
      },
      name: {
        type: Sequelize.STRING(512)
      },
      type: {
        type: Sequelize.STRING(50)
      },
      size: {
        type: Sequelize.BIGINT.UNSIGNED
      },
      bucket_id: {
        type: Sequelize.STRING(24)
      }
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('photos');
  }
};
