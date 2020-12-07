module.exports = (sequelize, DataTypes) => {
  const album = sequelize.define(
    'album',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      parent_id: {
        type: DataTypes.INTEGER,
        hierarchy: true,
        get() {
          return this.getDataValue('parentId');
        },
      },
      name: {
        type: DataTypes.STRING,
      },
      bucket: {
        type: DataTypes.STRING(24),
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        get() {
          return this.getDataValue('userId');
        },
      },
      encrypt_version: {
        type: DataTypes.STRING
      }
    },
    {
      timestamps: true,
      underscored: true,
      indexes: [{ name: 'name', fields: ['name'] }],
    }
  );

  album.associate = function (models) {
    album.hasOne(models.album_metadata);
    album.hasMany(models.photo);
    album.belongsTo(models.users);
  };

  return album;
};