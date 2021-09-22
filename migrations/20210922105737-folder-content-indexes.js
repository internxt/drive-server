module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('folders', {
      fields: ['parent_id'],
      name: 'parent_id_index'
    });

    await queryInterface.addIndex('folders', {
      fields: ['user_id', 'id'],
      name: 'user_id_primary_key_index'
    });

    await queryInterface.removeIndex('folders', 'user_id_folders_index');
  },

  down: async (queryInterface) => {
    await queryInterface.addIndex('folders', {
      fields: ['user_id'],
      name: 'user_id_folders_index'
    });

    await queryInterface.removeIndex('folders', 'parent_id_index');
    await queryInterface.removeIndex('folders', 'user_id_primary_key_index');
  }
};
