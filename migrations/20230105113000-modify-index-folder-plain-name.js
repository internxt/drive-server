'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('folders', 'folders_plainname_parentid_key').then(() =>
      queryInterface.addIndex('folders', {
        fields: ['plain_name', 'parent_id'],
        name: 'folders_plainname_parentid_key',
        unique: true,
        where: { deleted: { [Sequelize.Op.eq]: false } },
      }),
    );
  },

  down: (queryInterface) => {
    return queryInterface.removeIndex('folders', 'folders_plainname_parentid_key');
  },
};
