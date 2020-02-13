module.exports = (sequelize, DataTypes) => {
  const folder = sequelize.define('folder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    parentId: {
      type: DataTypes.INTEGER,
      hierarchy: true
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
    },
    icon_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'icon',
        key: 'id'
      }
    },
    color: {
      type: DataTypes.STRING
    }
  },
  {
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'name', fields: ['name'] }
    ]
  })

  folder.associate = function(models) {
    folder.hasOne(models.folder_metadata)
    folder.hasMany(models.file)
    folder.belongsTo(models.users)
    folder.belongsTo(models.icon)
  }

  return folder
}
