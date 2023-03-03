import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

export enum MailTypes {
  InviteFriend = 'invite_friend',
  ResetPassword = 'reset_password',
  RemoveAccount = 'remove_account',
  EmailVerification = 'email_verification',
  DeactivateUser = 'deactivate_user',
}

interface Attributes {
  id: number;
  userId: number;
  mailType: MailTypes;
  attemptsCount: number;
  attemptsLimit: number;
  lastMailSent: Date;
}

export type MailLimitModel = ModelDefined<Attributes, Attributes>;

export default (database: Sequelize): MailLimitModel => {
  const MailLimit: MailLimitModel = database.define(
    'mail_limits',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      mailType: {
        type: DataTypes.ENUM(
          MailTypes.InviteFriend, 
          MailTypes.RemoveAccount, 
          MailTypes.ResetPassword,
          MailTypes.EmailVerification
        ),
        allowNull: false
      },
      attemptsCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      attemptsLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      lastMailSent: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date(0)
      }
    },
    {
      tableName: 'mail_limits',
      underscored: true,
      timestamps: false
    },
  );

  return MailLimit;
};
