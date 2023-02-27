'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('files', {
      fields: ['uuid'],
      name: 'files_uuid_index',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('files', 'files_uuid_index');
  }
};
