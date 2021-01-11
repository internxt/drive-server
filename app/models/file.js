module.exports = (sequelize, DataTypes) => {
  const file = sequelize.define('file',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      fileId: {
        type: DataTypes.STRING(24)
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
      bucket: {
        type: DataTypes.STRING(24)
      },
      folder_id: {
        type: DataTypes.INTEGER
      },
      created_at: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('createdAt');
        }
      },
      encrypt_version: {
        type: DataTypes.STRING
      }
    },
    {
      timestamps: true,
      underscored: true,
      indexes: [{ name: 'name', fields: ['name'] }]
    });

  file.associate = (models) => {
    file.belongsTo(models.folder);
  };

  return file;
};
