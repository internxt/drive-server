'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('folders', {
      fields: ['uuid'],
      name: 'uuid_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('folders', 'uuid_index');
  }
};
