module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.addConstraint('files', {
        type: 'FOREIGN KEY',
        fields: ['folder_id'],
        name: 'files_folder_id_foreign_id_fk',
        references: {
          table: 'folders',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
      })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeConstraint('files', 'files_folder_id_foreign_id_fk')
    ]);
  }
};
