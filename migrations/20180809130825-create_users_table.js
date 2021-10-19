module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      lastname: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password: {
        type: Sequelize.BLOB('medium'),
        allowNull: false
      },
      mnemonic: {
        type: Sequelize.BLOB('medium')
      },
      isFreeTier: {
        type: Sequelize.BOOLEAN
      },
      root_folder_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'folders',
          key: 'id'
        }
      }
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('users');
  }
};
