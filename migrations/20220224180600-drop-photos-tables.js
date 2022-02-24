module.exports = {
  up: async (queryInterface) => {
    await queryInterface.dropTable('previews');
    await queryInterface.dropTable('photosalbums');
    await queryInterface.dropTable('albums');
    await queryInterface.dropTable('photos');
    await queryInterface.dropTable('usersphotos');
  },

  down: async (queryInterface, Sequelize) => {
    await this.createPreviewsTable(queryInterface, Sequelize);
    await this.createPhotosTable(queryInterface, Sequelize);
    await this.createUsersphotosTable(queryInterface, Sequelize);
    await this.createAlbumsTable(queryInterface, Sequelize);
    await this.createPhotosalbumsTable(queryInterface, Sequelize);
  },

  createPreviewsTable: (queryInterface, Sequelize) => {
    return queryInterface.createTable('previews', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(512)
      },
      type: {
        type: Sequelize.STRING(50)
      },
      size: {
        type: Sequelize.BIGINT.UNSIGNED
      }
    });
  },

  createPhotosTable: (queryInterface, Sequelize) => {
    return queryInterface.createTable('photos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      photo_id: {
        type: Sequelize.STRING(24)
      },
      name: {
        type: Sequelize.STRING(512)
      },
      type: {
        type: Sequelize.STRING(50)
      },
      size: {
        type: Sequelize.BIGINT.UNSIGNED
      },
      bucket_id: {
        type: Sequelize.STRING(24)
      }
    });
  },

  createUsersphotosTable: (queryInterface, Sequelize) => {
    return queryInterface.createTable('usersphotos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER(60),
        references: {
          model: 'users',
          key: 'id'
        }
      }
    });
  },

  createAlbumsTable: (queryInterface, Sequelize) => {
    return queryInterface.createTable('albums', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(512)
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'usersphotos',
          key: 'id'
        }
      }
    });
  },

  createPhotosalbumsTable: (queryInterface, Sequelize) => {
    return queryInterface.createTable('photosalbums', {
      photo_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'photos',
          key: 'id'
        }
      },
      album_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'albums',
          key: 'id'
        }
      }
    });
  },

};