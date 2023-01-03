'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface) => {
    return queryInterface.addIndex('folders', {
      fields: ['plain_name'],
      name: 'folders_plain_name_idx',
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeIndex('folders', 'folders_plain_name_idx');
  },
};
