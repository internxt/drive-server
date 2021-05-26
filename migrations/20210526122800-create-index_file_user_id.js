module.exports = {
  up: (queryInterface) => {
    return queryInterface.addIndex('files', {
      fields: ['user_id'],
      name: 'user_id_files_index'
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeIndex('files', 'user_id_files_index');
  }
};