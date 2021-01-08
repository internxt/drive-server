module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('files', 'bucketId'),
      queryInterface.changeColumn('files', 'fileId', {
        type: Sequelize.STRING(24)
      }),
      queryInterface.changeColumn('files', 'bucket', {
        type: Sequelize.STRING(24)
      }),
      queryInterface.changeColumn('folders', 'bucket', {
        type: Sequelize.STRING(24)
      }),
      queryInterface.changeColumn('shares', 'file', {
        type: Sequelize.STRING(24)
      }),
      queryInterface.changeColumn('users', 'userId', {
        type: Sequelize.STRING(60)
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('files', 'bucketId', { type: Sequelize.STRING }),
      queryInterface.changeColumn('files', 'fileId', {
        type: Sequelize.STRING
      }),
      queryInterface.changeColumn('files', 'bucket', {
        type: Sequelize.STRING
      }),
      queryInterface.changeColumn('folders', 'bucket', {
        type: Sequelize.STRING
      }),
      queryInterface.changeColumn('shares', 'file', { type: Sequelize.STRING }),
      queryInterface.changeColumn('users', 'userId', {
        type: Sequelize.STRING
      })
    ]);
  }
};
