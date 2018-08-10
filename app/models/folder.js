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
    },
    bucket: {
      type: DataTypes.STRING
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  },
  {
    timestamps: false,
    underscored: true,
    indexes: [
      { name: 'name', fields: ['name'] }
    ]
  })

  folder.isHierarchy()

  folder.associate = function(models) {
    folder.hasOne(models.folder_metadata)
    folder.hasMany(models.file)
    folder.belongsTo(models.users)
  }

  return folder
}
