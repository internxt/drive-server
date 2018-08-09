module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('users', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    // can be one field.
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    root_folder_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'folders',
        key: 'id'
      }
    }
  })

  User.associate = function(models) {
    User.hasMany(models.folder);
  }

  return User
}
