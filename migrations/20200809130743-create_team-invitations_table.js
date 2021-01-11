module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('teamsinvitations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      id_team: {
        type: Sequelize.INTEGER
      },
      user: {
        type: Sequelize.STRING
      },
      token: {
        type: Sequelize.STRING
      },
      is_used: {
        type: Sequelize.BOOLEAN
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('teamsinvitations');
  }
};
