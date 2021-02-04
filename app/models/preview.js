module.exports = (sequelize, DataTypes) => {
  const preview = sequelize.define(
    'previews',
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
      type: {
        type: DataTypes.STRING
      },
      size: {
        type: DataTypes.BIGINT.UNSIGNED
      },
      hash: {
        type: DataTypes.STRING
      },
      previewId: {
        type: DataTypes.STRING
      },
      photoId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'photos',
          key: 'id'
        }
      },
      bucketId: {
        type: DataTypes.STRING,
        references: {
          model: 'usersphotos',
          key: 'rootPreviewId'
        }
      }
    },
    {
      timestamps: true,
      underscored: true
    }
  );

  preview.associate = (models) => {
    preview.belongsTo(models.photos, { foreignKey: 'photoId' });
  };

  return preview;
};