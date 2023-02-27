'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('shares', {
      type: 'FOREIGN KEY',
      fields: ['folder_uuid'],
      name: 'shares_folder_uuid_fkey',
      references: {
        table: 'folders',
        field: 'uuid',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('shares', 'shares_folder_uuid_fkey');
  }
};
