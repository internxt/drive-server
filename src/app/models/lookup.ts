import { Sequelize, ModelDefined, DataTypes } from 'sequelize';
import { UserAttributes } from './user';
import { FileAttributes } from './file';
import { FolderAttributes } from './folder';

export interface LookUpAttributes {
  id: number
  itemId: FileAttributes['uuid'] | FolderAttributes['uuid']
  itemType: string
  userId: UserAttributes['uuid']
  name: FileAttributes['plain_name'] | FolderAttributes['name']
  tokenizedName: string
}

export type LookUpModel = ModelDefined<LookUpAttributes, LookUpAttributes>;

export default (database: Sequelize): LookUpModel => {
  const LookUp: LookUpModel = database.define(
    'look_up',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      itemId: {
        type: DataTypes.UUIDV4,
        allowNull: false,
      },
      itemType: {
        type: DataTypes.STRING(36),
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tokenizedName: {
        type: DataTypes.TSVECTOR,
        allowNull: false,
      },
      userId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'uuid'
        }, 
        onDelete: 'CASCADE'
      }
    },
    {
      underscored: true,
      freezeTableName: true,
      timestamps: false,
      indexes: [
        { name: 'user_uuid_look_up_index', fields: ['user_id'] },
        { name: 'item_id_look_up_index', fields: ['item_id'] },
      ],
    },
  );

  return LookUp;
};
