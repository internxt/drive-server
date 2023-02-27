'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('shares', {
      type: 'FOREIGN KEY',
      fields: ['file_uuid'],
      name: 'shares_file_uuid_fkey',
      references: {
        table: 'files',
        field: 'uuid',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('shares', 'shares_file_uuid_fkey');
  }
};
