module.exports = (sequelize, DataTypes) => {
  const folderMetadata = sequelize.define('folder_metadata',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      color: {
        type: DataTypes.STRING
      },
      icon: {
        type: DataTypes.STRING
      }
    },
    {
      timestamps: false,
      underscored: true
    });

  return folderMetadata;
};
