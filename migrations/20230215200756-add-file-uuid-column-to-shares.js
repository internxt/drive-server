'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('shares', 'file_uuid', {
      type: Sequelize.UUID,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('shares', 'file_uuid');
  }
};
