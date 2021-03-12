module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('usersphotos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER(60),
        references: {
          model: 'users',
          key: 'id'
        }
      }
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('usersphotos');
  },
};