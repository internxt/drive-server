'use strict';

module.exports = {
  up: async (queryInterface) => {
    return queryInterface.addIndex('folders', {
      fields: ['bucket'],
      name: 'bucket_index',
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeIndex('folders', 'bucket_index');
  },
};
