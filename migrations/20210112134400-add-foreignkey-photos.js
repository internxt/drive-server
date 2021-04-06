module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('photos', 'user_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'usersphotos',
          key: 'id'
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