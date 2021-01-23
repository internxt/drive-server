module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('albums', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(512)
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'usersphotos',
          key: 'id'
        }
      }
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('albums');
  }
};
