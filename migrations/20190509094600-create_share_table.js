module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('shares', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      token: {
        type: Sequelize.STRING
      },
      user: {
        type: Sequelize.STRING
      },
      file: {
        type: Sequelize.STRING
      },
      mnemonic: {
        type: Sequelize.BLOB('medium')
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('shares');
  }
};
