module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('deleted_files', {
      file_id: {
        type: Sequelize.STRING(24),
      },
      user_id: {
        type: Sequelize.INTEGER(11),
      },
      folder_id: {
        type: Sequelize.INTEGER(11),
      },
      bucket: {
        type: Sequelize.STRING(24),
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('deleted_files');
  },
};
