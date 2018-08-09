module.exports = (sequelize, DataTypes) => {
  const folder = sequelize.define('folder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
    }
  },
  {
    underscored: true,
    indexes: [
      { name: 'name', fields: ['name'] }
    ]
  })

  folder.isHierarchy()

  folder.associate = function(models) {
    folder.hasOne(models.folderMetadata)
    folder.hasMany(models.file)
    folder.belongsTo(models.users, { foreignKey: 'userId' })
  }

  return folder
}
