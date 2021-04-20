module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn('files', 'fileId', 'file_id');
    await queryInterface.renameColumn('folders', 'parentId', 'parent_id');
    await queryInterface.renameColumn('statistics', 'userAgent', 'user_agent');
    await queryInterface.renameColumn('users', 'userId', 'user_id');
    await queryInterface.renameColumn('users', 'isFreeTier', 'is_free_tier');
    await queryInterface.renameColumn('users', 'storeMnemonic', 'store_mnemonic');
    await queryInterface.renameColumn('users', 'hKey', 'h_key');
    await queryInterface.renameColumn('users', 'secret_2FA', 'secret_2_f_a');
    await queryInterface.renameColumn('users', 'errorLoginCount', 'error_login_count');
  },

  down: async (queryInterface) => {
    await queryInterface.renameColumn('files', 'file_id', 'fileId');
    await queryInterface.renameColumn('folders', 'parent_id', 'parentId');
    await queryInterface.renameColumn('statistics', 'user_agent', 'userAgent');
    await queryInterface.renameColumn('users', 'user_id', 'userId');
    await queryInterface.renameColumn('users', 'is_free_tier', 'isFreeTier');
    await queryInterface.renameColumn('users', 'store_mnemonic', 'storeMnemonic');
    await queryInterface.renameColumn('users', 'h_key', 'hKey');
    await queryInterface.renameColumn('users', 'secret_2_f_a', 'secret_2FA');
    await queryInterface.renameColumn('users', 'error_login_count', 'errorLoginCount');
  }
};
