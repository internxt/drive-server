module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('photos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      photo_id: {
        type: Sequelize.STRING,
      },
      name: {
        type: Sequelize.STRING,
      },
      type: {
        type: Sequelize.STRING,
      },
      size: {
        type: Sequelize.INTEGER,
      },
      bucket: {
        type: Sequelize.STRING,
      },
      album_id: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      encrypt_version: {
        type: Sequelize.STRING,
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('photos');
  },
};
