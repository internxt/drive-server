'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint('folders', {
      type: 'UNIQUE',
      fields: ['uuid'],
      name: 'folders_uuid_UNIQUE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('folders', 'folders_uuid_UNIQUE');
  }
};
