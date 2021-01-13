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
    UserPhotos.hasOne(models.users);
    UserPhotos.hasOne(models.album);
    UserPhotos.hasOne(models.preview);
  };

  return UserPhotos;
};
