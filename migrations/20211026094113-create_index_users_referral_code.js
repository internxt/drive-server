module.exports = {
  up: async (queryInterface) => {
    return queryInterface.addIndex('users', {
      fields: ['referral_code'],
      name: 'referral_code_index'
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeIndex('users', 'referral_code_index');
  }
};
