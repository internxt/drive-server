'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint('files', {
      type: 'FOREIGN KEY',
      fields: ['folder_uuid'],
      name: 'files_folder_uuid_fkey',
      references: {
        table: 'folders',
        field: 'uuid',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('files', 'files_folder_uuid_fkey');
  }
};
