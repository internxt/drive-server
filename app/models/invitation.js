module.exports = (sequelize, DataTypes) => {
  const Invitation = sequelize.define('Invitation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      host: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: false
      },
      guest: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: false
      },
      inviteId: {
        type: DataTypes.STRING(216),
        allowNull: false
      }
    },
    {
      timestamps: true,
      underscored: true,
      tableName: 'invitations'
    });

  Invitation.associate = (models) => {
    Invitation.belongsTo(models.users, { foreignKey: 'host', targetKey: 'id' });
    Invitation.belongsTo(models.users, { foreignKey: 'guest', targetKey: 'id' });
  };

  return Invitation;
};
