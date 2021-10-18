import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface UserAttributes {
  id: number
  userId: string
  name: string
  lastname: string
  email: string
  username: string
  bridgeUser: string
  password: string
  mnemonic: string
  rootFolderId: number
  isCreated: any
  hKey: string
  secret_2FA: string
  errorLoginCount: number
  isEmailActivitySended: number
  referral: string
  syncDate: Date
  uuid: string
  lastResend: Date
  credit: number
  welcomePack: boolean
  registerCompleted: boolean
  backupsBucket: string
  sharedWorkspace: boolean
  tempKey: string
}

type UserModel = ModelDefined<UserAttributes, UserAttributes>;

const create = (database: Sequelize): UserModel => {
  const User: UserModel = database.define(
    'users',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.STRING(60)
      },
      name: {
        type: DataTypes.STRING
      },
      lastname: {
        type: DataTypes.STRING
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false
      },
      username: {
        type: DataTypes.STRING,
        unique: true
      },
      bridgeUser: {
        type: DataTypes.STRING
      },
      password: {
        type: DataTypes.STRING
      },
      mnemonic: {
        type: DataTypes.STRING
      },
      root_folder_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'folders',
          key: 'id'
        }
      },
      isCreated: {
        type: DataTypes.VIRTUAL
      },
      hKey: {
        type: DataTypes.STRING,
        allowNull: false
      },
      secret_2FA: {
        type: DataTypes.STRING
      },
      errorLoginCount: {
        type: DataTypes.INTEGER
      },
      is_email_activity_sended: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: false
      },
      referral: {
        type: DataTypes.STRING,
        allowNull: true
      },
      syncDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      uuid: {
        type: DataTypes.STRING(36),
        unique: true
      },
      lastResend: {
        type: DataTypes.DATE,
        allowNull: true
      },
      credit: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      welcomePack: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      registerCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      backupsBucket: {
        type: DataTypes.STRING,
        allowNull: true
      },
      sharedWorkspace: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      tempKey: {
        type: DataTypes.STRING
      }
    },
    {
      tableName: 'users',
      timestamps: true,
      underscored: true
    },
    // {
    //   defaultScope: {
    //     attributes: { exclude: ['userId'] }
    //   }
    // }
  );

  User.hasMany(models.folder);
  User.hasMany(models.file);
  User.hasOne(models.usersphotos);
  User.hasOne(models.AppSumo);
  User.hasOne(models.keyserver);
  User.hasOne(models.plan);
  User.hasMany(models.device);
  User.hasMany(models.Invitation, { foreignKey: 'host' });

  return User;
}

export { create as default, UserModel };
