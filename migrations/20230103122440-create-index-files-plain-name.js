'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface) => {
    return queryInterface.addIndex('files', {
      fields: ['plain_name'],
      name: 'files_plain_name_idx',
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeIndex('files', 'files_plain_name_idx');
  },
};
