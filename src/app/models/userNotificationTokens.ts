import { DataTypes, ModelDefined, Sequelize } from 'sequelize';

export interface UserNotificationTokenAttributes {
  id: string;
  userId: string;
  token: string;
  type: 'macos' | 'android' | 'ios';
  createdAt: Date;
  updatedAt: Date;
}

export type UserNotificationTokenModel = ModelDefined<UserNotificationTokenAttributes, UserNotificationTokenAttributes>;

export default (database: Sequelize): UserNotificationTokenModel => {
  const UserNotificationToken: UserNotificationTokenModel = database.define(
    'user_notification_tokens',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'uuid',
        },
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('macos', 'android', 'ios'),
        allowNull: false,
      },
      createdAt: {
        field: 'created_at',
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        field: 'updated_at',
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'user_notification_tokens',
      timestamps: true,
      underscored: true,
    },
  );

  return UserNotificationToken;
};
