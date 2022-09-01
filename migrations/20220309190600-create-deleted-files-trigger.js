module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION insert_deleted_files()
      RETURNS trigger AS
      $$
      BEGIN
      INSERT INTO deleted_files(file_id, user_id, folder_id, bucket) select file_id, user_id, folder_id, bucket from files where files.folder_id = OLD.id;
      RETURN OLD;
      END;
      $$
      LANGUAGE 'plpgsql';`);
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS copy_deleted_files_on_delete ON folders;`,
    );
    await queryInterface.sequelize.query(
      `CREATE TRIGGER copy_deleted_files_on_delete BEFORE DELETE on folders
			FOR EACH ROW
			EXECUTE PROCEDURE insert_deleted_files()`,
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS copy_deleted_files_on_delete ON folders;`,
    );
  },
};
