'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addIndex('files', ['name', 'type', 'folder_id'], {
      name: 'files_name_type_folderid_deleted_unique',
      unique: true,
      where: { deleted: { [Sequelize.Op.eq]: false } },
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeIndex(
      'files',
      'files_name_type_folderid_deleted_unique',
    );
  },
};
