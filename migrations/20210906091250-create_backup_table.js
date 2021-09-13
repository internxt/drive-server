module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('backups', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      path: {
        type: Sequelize.STRING
      },
      fileId: {
        type: Sequelize.STRING(24)
      },
      deviceId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'devices',
          key: 'id'
        }
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      interval: {
        type: Sequelize.INTEGER
      },
      size: {
        type: Sequelize.BIGINT.UNSIGNED
      },
      bucket: {
        type: Sequelize.STRING(24)
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      },
      encrypt_version: {
        type: Sequelize.STRING
      },
      hash: {
        type: Sequelize.STRING
      }
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('backups');
  }
};
