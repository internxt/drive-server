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
    });

  UserPhotos.associate = (models) => {
    UserPhotos.belongsTo(models.users, { foreignKey: 'userId' });
  };

  return UserPhotos;
};
