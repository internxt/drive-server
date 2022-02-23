'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('folders', ['parent_id'], {
      name: 'folders_parent_id_idx'
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('folders', 'folders_parent_id_idx');
  }
};
