module.exports = (sequelize, DataTypes) => {
  const photo = sequelize.define(
    'photo',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      photoId: {
        type: DataTypes.STRING(24)
      },
      name: {
        type: DataTypes.STRING(512)
      },
      type: {
        type: DataTypes.STRING(50)
      },
      size: {
        type: DataTypes.BIGINT.UNSIGNED
      },
      bucketId: {
        type: DataTypes.STRING(24)
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
    photo.belongsToMany(models.album, { through: 'photosalbums' });
    photo.hasOne(models.usersphotos, { foreignKey: 'userId' });
  };

  return photo;
};
