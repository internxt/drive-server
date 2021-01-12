module.exports = (sequelize, DataTypes) => {
  const preview = sequelize.define(
    'preview',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
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
      previewId: {
        type: DataTypes.STRING(24)
      },
      bucketId: {
        type: DataTypes.STRING(24),
        references: {
          model: 'usersphotos',
          key: 'rootPreviewId'
        }
      },
      photoId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'photos',
          key: 'id'
        }
      }
    },
    {
      timestamps: true,
      underscored: true
    }
  );

  preview.associate = (models) => {
    preview.belongsTo(models.usersphotos, { foreignKey: 'rootPreviewId' });
    preview.belongsTo(models.photos);
  };

  return preview;
};