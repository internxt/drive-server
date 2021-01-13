module.exports = (sequelize, DataTypes) => {
  const UserPhotos = sequelize.define('usersphotos',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.STRING(60),
        references: {
          model: 'users',
          key: 'id'
        }
      },
      rootAlbumId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'albums',
          key: 'id'
        }
      },
      rootPreviewId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'previews',
          key: 'id'
        }
      },
      createdAt: {
        type: DataTypes.VIRTUAL
      },
      updatedAt: {
        type: DataTypes.VIRTUAL
      }
    },
    {
      timestamps: true,
      underscored: true
    },
    {
      defaultScope: {
        attributes: { exclude: ['userId'] }
      }
    });

  UserPhotos.associate = (models) => {
    UserPhotos.hasOne(models.users, { foreignKey: 'userId' });
    UserPhotos.hasOne(models.album, { foreignKey: 'rootAlbumId' });
    UserPhotos.hasOne(models.preview, { foreignKey: 'rootPreviewId' });
  };

  return UserPhotos;
};
