module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('files', 'fileId', 'file_id'),
      queryInterface.renameColumn('folders', 'parentId', 'parent_id'),
      queryInterface.renameColumn('statistics', 'userAgent', 'user_agent'),
      queryInterface.renameColumn('users', 'userId', 'user_id'),
      queryInterface.renameColumn('users', 'isFreeTier', 'is_free_tier'),
      queryInterface.renameColumn('users', 'storeMnemonic', 'store_mnemonic'),
      queryInterface.renameColumn('users', 'hKey', 'h_key'),
      queryInterface.renameColumn('users', 'secret_2FA', 'secret_2_f_a'),
      queryInterface.renameColumn('users',
        'errorLoginCount',
        'error_login_count'
      )
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('files', 'file_id', 'fileId'),
      queryInterface.renameColumn('folders', 'parent_id', 'parentId'),
      queryInterface.renameColumn('statistics', 'user_agent', 'userAgent'),
      queryInterface.renameColumn('users', 'user_id', 'userId'),
      queryInterface.renameColumn('users', 'is_free_tier', 'isFreeTier'),
      queryInterface.renameColumn('users', 'store_mnemonic', 'storeMnemonic'),
      queryInterface.renameColumn('users', 'h_key', 'hKey'),
      queryInterface.renameColumn('users', 'secret_2_f_a', 'secret_2FA'),
      queryInterface.renameColumn('users',
        'error_login_count',
        'errorLoginCount'
      )
    ]);
  }
};
