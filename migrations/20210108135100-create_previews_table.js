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
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
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
