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
      name: {
        type: DataTypes.STRING
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
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

  album.associate = (models) => {
    album.belongsToMany(models.photos, { through: 'photosalbums' });
    album.belongsTo(models.usersphotos, { foreignKey: 'userId' });
  };

  return album;
};
