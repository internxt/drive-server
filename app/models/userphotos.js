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
        type: DataTypes.STRING,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      rootAlbumId: {
        type: DataTypes.STRING
      },
      rootPreviewId: {
        type: DataTypes.STRING
      },
      deleteFolderId: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      timestamps: true,
      underscored: true
    });

  UserPhotos.associate = (models) => {
    UserPhotos.belongsTo(models.users, { foreignKey: 'userId' });
    UserPhotos.hasMany(models.photos, { foreignKey: 'userId' });
  };

  return UserPhotos;
};
