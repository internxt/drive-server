module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('files', 'user_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('files', 'user_id');
  }
};