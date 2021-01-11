module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('keyserver', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      public_key: {
        type: Sequelize.STRING(920),
        allowNull: false
      },
      private_key: {
        type: Sequelize.STRING(1356),
        allowNull: false
      },
      revocation_key: {
        type: Sequelize.STRING(476),
        allowNull: false
      },
      encrypt_version: {
        type: Sequelize.STRING,
        allowNull: true
      },

      created_at: {
        type: Sequelize.DATE
      },
      updated_at: {
        type: Sequelize.DATE
      }

    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('keyserver');
  }
};
