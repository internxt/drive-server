'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('shares', {
      type: 'FOREIGN KEY',
      fields: ['file_id'],
      name: 'shares_file_id_fkey',
      references: {
        table: 'files',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('shares', {
      type: 'FOREIGN KEY',
      fields: ['folder_id'],
      name: 'shares_folder_id_fkey',
      references: {
        table: 'folders',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('shares', 'shares_file_id_fkey');
    await queryInterface.removeConstraint('shares', 'shares_folder_id_fkey');
  },
};
