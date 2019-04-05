module.exports = (sequelize, DataTypes) => {
  const file = sequelize.define('file', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    fileId: {
      type: DataTypes.STRING
    },
    bucketId: {
      type: DataTypes.STRING
    },
    name: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.STRING
    },
    size: {
      type: DataTypes.INTEGER
    }
  },
  {
    timestamps: false,
    underscored: true,
    indexes: [
      { name: 'name', fields: ['name'] }
    ]
  })

  file.associate = function(models) {
    file.belongsTo(models.folder)
  }

  return file
}
