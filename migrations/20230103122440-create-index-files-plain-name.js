'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addIndex('files', ['plain_name', 'type', 'folder_id'], {
      name: 'files_plainname_type_folderid_deleted_key',
      unique: true,
      where: { deleted: { [Sequelize.Op.eq]: false } },
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeIndex('files', 'files_plainname_type_folderid_deleted_key');
  },
};

