module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('foldersancestors', {
      folder_id: {
        type: Sequelize.INTEGER
      },
      ancestor_id: {
        type: Sequelize.INTEGER
      }
    });

    await queryInterface.addConstraint('foldersancestors', {
      type: 'PRIMARY KEY',
      fields: ['folder_id', 'ancestor_id']
    });

    await queryInterface.addConstraint('foldersancestors', {
      type: 'UNIQUE',
      fields: ['folder_id', 'ancestor_id'],
      name: 'foldersancestors_folder_id_ancestor_id_unique'
    });

    await queryInterface.addConstraint('foldersancestors', {
      type: 'FOREIGN KEY',
      fields: ['folder_id'],
      name: 'foldersancestors_ibfk_1',
      references: {
        table: 'folders',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });

    await queryInterface.addConstraint('foldersancestors', {
      type: 'FOREIGN KEY',
      fields: ['ancestor_id'],
      name: 'foldersancestors_ibfk_2',
      references: {
        table: 'folders',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('foldersancestors');
  }
};
