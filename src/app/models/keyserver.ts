import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface KeyServerAttributes {
  id: number;
  userId: number;
  publicKey: string;
  privateKey: string;
  revocationKey: string;
  encryptVersion: string;
}

export type KeyServerModel = ModelDefined<KeyServerAttributes, KeyServerAttributes>;

export default (database: Sequelize): KeyServerModel => {
  const KeyServer: KeyServerModel = database.define(
    'keyserver',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        allowNull: false,
      },
      public_key: {
        type: DataTypes.STRING(920),
        allowNull: false,
      },
      private_key: {
        type: DataTypes.STRING(1356),
        allowNull: false,
      },
      revocation_key: {
        type: DataTypes.STRING(476),
        allowNull: false,
      },
      encrypt_version: {
        type: DataTypes.STRING,
      },
    },
    {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  );

  return KeyServer;
};
