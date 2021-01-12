module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('photos', 'user_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'usersphotos',
          key: 'user_id'
        }
      })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('photos', 'user_id')
    ]);
  }
};