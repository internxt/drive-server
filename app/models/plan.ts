import { Sequelize, ModelDefined, DataTypes } from 'sequelize';

interface PlanAttributes {
  id: number,
  fileId: string,
  name: string,
  type: string,
  size: number,
  hash: string,
  bucketId: string,
  userId: number,
  creationTime: Date,
  device: string
}

type PlanModel = ModelDefined<PlanAttributes, PlanAttributes>;

const create = (database: Sequelize): PlanModel => {
  const Plan: PlanModel = database.define(
    'plan',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        // reference: {
        //   model: 'users',
        //   key: 'id'
        // }
      },
      name: {
        type: DataTypes.STRING
      },
      type: {
        type: DataTypes.ENUM('subscription', 'one_time')
      },
      createdAt: {
        type: DataTypes.DATE
      },
      updatedAt: {
        type: DataTypes.DATE
      },
      limit: {
        type: DataTypes.INTEGER
      }
    },
    {
      tableName: 'plans',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: false,
          fields: ['name']
        }
      ]
    }
  );

  Plan.belongsTo(models.users);

  return Plan;
}

export { create as default, PlanModel };
