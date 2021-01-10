module.exports = (sequelize, DataTypes) => {
  const folder = sequelize.define('folder',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      parentId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'folders',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING
      },
      bucket: {
        type: DataTypes.STRING(24)
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
      },
      encrypt_version: {
        type: DataTypes.STRING
      },
      id_team: {
        type: DataTypes.INTEGER
      }
    },
    {
      timestamps: true,
      underscored: true,
      indexes: [{ name: 'name', fields: ['name'] }]
    });

  folder.associate = (models) => {
    folder.hasOne(models.folder_metadata);
    folder.hasMany(models.file);
    folder.belongsTo(models.users);
    folder.belongsTo(models.icon);
    folder.hasMany(models.folder, {
      foreignKey: 'parent_id',
      as: 'children'
    });
  };

  return folder;
};
