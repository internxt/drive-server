module.exports = (sequelize, DataTypes) => {
  const photo = sequelize.define(
    'photo',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      photo_id: {
        type: DataTypes.STRING(24),
        get() {
          return this.getDataValue('photoId');
        },
      },
      name: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
      },
      size: {
        type: DataTypes.BIGINT.UNSIGNED,
      },
      bucket: {
        type: DataTypes.STRING(24),
      },
      album_id: {
        type: DataTypes.INTEGER,
        get() {
          return this.getDataValue('albumId');
        },
      },
      created_at: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('createdAt');
        },
      },
      encrypt_version: {
        type: DataTypes.STRING,
        get() {
          return this.getDataValue('encryptVersion');
        },
      }
    },
    {
      timestamps: true,
      underscored: true,
      indexes: [{ name: 'name', fields: ['name'] }],
    }
  );

  photo.associate = function (models) {
    photo.belongsTo(models.album);
  };

  return photo;
};