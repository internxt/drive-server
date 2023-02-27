'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('files', 'uuid', {
      type: Sequelize.UUID,
      unique: true,
      defaultValue: Sequelize.literal('uuid_generate_v4()')
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('files', 'uuid');
  }
};
