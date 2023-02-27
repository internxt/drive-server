'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('files', 'folder_uuid', {
      type: Sequelize.UUID,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('files', 'folder_uuid');
  }
};
