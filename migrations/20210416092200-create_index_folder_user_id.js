module.exports = {
  up: (queryInterface) => {
    return queryInterface.addIndex('folders', {
      fields: ['user_id'],
      name: 'user_id_folders_index'
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeIndex('folders', 'user_id_folders_index');
  }
};
