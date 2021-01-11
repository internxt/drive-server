module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('files', 'fileId', {
        type: Sequelize.STRING
      }),
      queryInterface.addColumn('files', 'bucket', {
        type: Sequelize.STRING
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('files', 'fileId'),
      queryInterface.removeColumn('files', 'bucket')
    ]);
  }
};
