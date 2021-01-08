module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('team_invitations', {
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
    return queryInterface.dropTable('team_invitations');
  }
};
