module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('shares', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('shares', 'file_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('shares', 'folder_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('shares', 'times_valid', {
      type: Sequelize.INTEGER,
      defaultValue: -1,
    });
    await queryInterface.addColumn('shares', 'active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
    await queryInterface.addColumn('shares', 'created_at', {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('now'),
    });
    await queryInterface.addColumn('shares', 'updated_at', {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('now'),
    });

    await queryInterface.sequelize.query(
      'UPDATE shares set user_id = (select id from users where users.email = shares.user);',
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('shares', 'user_id');
    await queryInterface.removeColumn('shares', 'file_id');
    await queryInterface.removeColumn('shares', 'folder_id');
    await queryInterface.removeColumn('shares', 'times_valid');
    await queryInterface.removeColumn('shares', 'active');
    await queryInterface.removeColumn('shares', 'created_at');
    await queryInterface.removeColumn('shares', 'updated_at');
  },
};
