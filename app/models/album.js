module.exports = (sequelize, DataTypes) => {
  const album = sequelize.define(
    'albums',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      parentId: {
        type: DataTypes.INTEGER
      },
      name: {
        type: DataTypes.STRING(512)
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    },
    {
      timestamps: true,
      underscored: true
    }
  );

  album.associate = (models) => {
    album.belongsToMany(models.photos, { through: 'photosalbums' });
    album.belongsTo(models.users);
  };

  return album;
};
