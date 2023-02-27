'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('folders', 'parent_uuid', {
      type: Sequelize.UUID,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('folders', 'parent_uuid');
  }
};

