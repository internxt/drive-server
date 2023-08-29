import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

export interface SharingAttributes {
  id: string;
  itemId: string;
  itemType: 'file' | 'folder';
  ownerId: string;
  sharedWith: string;
  encryptionKey: string;
  encryptionAlgorithm: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SharingsModel = ModelDefined<SharingAttributes, SharingAttributes>;

export default (database: Sequelize): SharingsModel => {
  const Sharings: SharingsModel = database.define(
    'sharings',
    {
      id: {
        type: DataTypes.UUIDV4,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      itemId: {
        type: DataTypes.UUIDV4,
        allowNull: false
      },
      itemType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      ownerId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'uuid'
        }
      },
      sharedWith: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'uuid'
        }
      },
      encryptionKey: {
        type: DataTypes.STRING(800),
        allowNull: false
      },
      encryptionAlgorithm: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'sharings',
      underscored: true,
      timestamps: true
    },
  );

  return Sharings;
};
