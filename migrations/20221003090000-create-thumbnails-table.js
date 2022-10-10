module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      'thumbnails',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        file_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        max_width: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        max_height: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        type: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        size: {
          type: Sequelize.BIGINT.UNSIGNED,
        },
        bucket_id: {
          type: Sequelize.STRING(24),
        },
        bucket_file: {
          type: Sequelize.STRING(24),
        },
        encrypt_version: {
          type: Sequelize.STRING(20),
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('now'),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('now'),
        },
      },
      {
        uniqueKeys: {
          unique_thumbnail: {
            fields: ['file_id', 'max_width', 'max_height', 'type'],
          },
        },
      },
    );

    await queryInterface.addConstraint('thumbnails', {
      type: 'FOREIGN KEY',
      fields: ['file_id'],
      name: 'thumbnails_file_id_fkey',
      references: {
        table: 'files',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeConstraint(
      'thumbnails',
      'thumbnails_file_id_fkey',
    );
    await queryInterface.dropTable('thumbnails');
  },
};
