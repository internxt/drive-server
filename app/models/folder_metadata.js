module.exports = (sequelize, DataTypes) => {
  const folderMetadata = sequelize.define('folder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    color: {
      type: DataTypes.String,
    },
    icon: {
      type: DataTypes.String
    }
  },
  {
    timestamps: false,
    underscored: true,
  })

  return folderMetadata
}
