module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('files', 'bucketId');
    await queryInterface.changeColumn('files', 'fileId', { type: Sequelize.STRING(24) });
    await queryInterface.changeColumn('files', 'bucket', { type: Sequelize.STRING(24) });
    await queryInterface.changeColumn('folders', 'bucket', { type: Sequelize.STRING(24) });
    await queryInterface.changeColumn('shares', 'file', { type: Sequelize.STRING(24) });
    await queryInterface.changeColumn('users', 'userId', { type: Sequelize.STRING(60) });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('files', 'bucketId', { type: Sequelize.STRING });
    await queryInterface.changeColumn('files', 'fileId', { type: Sequelize.STRING });
    await queryInterface.changeColumn('files', 'bucket', { type: Sequelize.STRING });
    await queryInterface.changeColumn('folders', 'bucket', { type: Sequelize.STRING });
    await queryInterface.changeColumn('shares', 'file', { type: Sequelize.STRING });
    await queryInterface.changeColumn('users', 'userId', { type: Sequelize.STRING });
  }
};
