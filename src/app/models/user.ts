import { DataTypes, ModelDefined, Sequelize } from 'sequelize';

export interface UserAttributes {
  id: number;
  userId: string;
  name: string;
  lastname: string;
  email: string;
  username: string;
  bridgeUser: string;
  password: string;
  mnemonic: string;
  rootFolderId: number;
  hKey: Buffer;
  secret_2FA: string;
  errorLoginCount: number;
  isEmailActivitySended: number;
  referralCode: string;
  referrer: string;
  syncDate: Date;
  uuid: string;
  lastResend: Date;
  credit: number;
  welcomePack: boolean;
  registerCompleted: boolean;
  backupsBucket: string;
  sharedWorkspace: boolean;
  avatar: string;
  emailVerified: boolean;
  lastPasswordChangedAt: Date;
  updatedAt: Date;
  tierId?: string;
}

export type UserModel = ModelDefined<UserAttributes, UserAttributes>;

export default (database: Sequelize): UserModel => {
  const User: UserModel = database.define(
    'users',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.STRING(60),
      },
      name: {
        type: DataTypes.STRING,
      },
      lastname: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        unique: true,
      },
      bridgeUser: {
        type: DataTypes.STRING,
      },
      password: {
        type: DataTypes.STRING,
      },
      mnemonic: {
        type: DataTypes.STRING,
      },
      root_folder_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'folders',
          key: 'id',
        },
      },
      hKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      secret_2FA: {
        type: DataTypes.STRING,
      },
      errorLoginCount: {
        type: DataTypes.INTEGER,
      },
      is_email_activity_sended: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: false,
      },
      referralCode: {
        type: DataTypes.STRING,
        allowNull: true,
        // Replace after migration
        // allowNull: false,
        // unique: true
      },
      referrer: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      syncDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      uuid: {
        type: DataTypes.STRING(36),
        unique: true,
      },
      lastResend: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      credit: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      welcomePack: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      registerCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      backupsBucket: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sharedWorkspace: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      lastPasswordChangedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      tierId: {
        type: DataTypes.STRING(36),
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      underscored: true,
    },
  );

  return User;
};
