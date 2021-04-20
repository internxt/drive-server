module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('photos', 'user_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'usersphotos',
        key: 'id'
      }
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('photos', 'user_id');
  }
};
