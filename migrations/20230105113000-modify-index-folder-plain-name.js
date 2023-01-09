'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('folders', 'folders_plainname_parentid_key');
    await queryInterface.addIndex('folders', {
      fields: ['plain_name', 'parent_id'],
      name: 'folders_plainname_parentid_key',
      unique: true,
      where: { deleted: { [Sequelize.Op.eq]: false } },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('folders', 'folders_plainname_parentid_key');
  },
};
