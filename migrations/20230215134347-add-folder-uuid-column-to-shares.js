'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('shares', 'folder_uuid', {
      type: Sequelize.UUID,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('shares', 'folder_uuid');
  }
};
