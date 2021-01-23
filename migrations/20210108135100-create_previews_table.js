module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('previews', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(512)
      },
      type: {
        type: Sequelize.STRING(50)
      },
      size: {
        type: Sequelize.BIGINT.UNSIGNED
      }
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('previews');
  }
};
