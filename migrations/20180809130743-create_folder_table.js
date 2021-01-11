module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('folders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      parentId: {
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      bucket: {
        type: Sequelize.STRING
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      hierarchy_level: {
        type: Sequelize.INTEGER
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('folders');
  }
};
