'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('folders', 'uuid', {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('uuid_generate_v4()')
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('folders', 'uuid');
  }
};
