module.exports = (sequelize, DataTypes) => {
  const photo = sequelize.define(
    'photos',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      photoId: {
        type: DataTypes.STRING
      },
      name: {
        type: DataTypes.STRING
      },
      type: {
        type: DataTypes.STRING
      },
      size: {
        type: DataTypes.BIGINT.UNSIGNED
      },
      bucketId: {
        type: DataTypes.STRING
      },
      userId: {
        type: DataTypes.INTEGER,
        reference: {
          model: 'usersphotos',
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
    }
  );

  photo.associate = (models) => {
    photo.belongsToMany(models.albums, { through: 'photosalbums' });
    photo.hasOne(models.usersphotos, { foreignKey: 'userId' });
  };

  return photo;
};
