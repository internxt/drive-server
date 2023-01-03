'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface) => {
    return queryInterface.addIndex('folders', {
      fields: ['plain_name', 'parent_id'],
      name: 'folders_plainname_parentid_key',
      unique: true,
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeIndex('folders', 'folders_plainname_parentid_key');
  },
};
