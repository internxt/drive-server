module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `CREATE TRIGGER if not exists xCloud.copy_deleted_files_on_delete BEFORE DELETE on xCloud.folders
			FOR EACH ROW
			BEGIN
			INSERT INTO xCloud.deleted_files(file_id, user_id, folder_id, bucket) select file_id, user_id, folder_id, bucket from xCloud.files where xCloud.files.folder_id = OLD.id;
			END`,
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query('drop trigger xCloud.copy_deleted_files_on_delete;');
  },
};
