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
      fileId: {
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
      hash: {
        type: DataTypes.STRING
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
    photo.hasOne(models.previews);
  };

  return photo;
};
