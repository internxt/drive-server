module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('photo_shares', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      token: {
        type: Sequelize.STRING,
      },
      user: {
        type: Sequelize.STRING,
      },
      photo: {
        type: Sequelize.STRING,
      },
      is_folder: {
        type: Sequelize.BOOLEAN,
      },
      mnemonic: {
        type: Sequelize.BLOB('medium'),
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('photo_shares');
  },
};