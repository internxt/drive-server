module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.addIndex('folders', {
        fields: ['user_id'],
        name: 'user_id_folders_index'
      })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeIndex('folders', 'user_id_folders_index')
    ]);
  }
};
