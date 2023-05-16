import { Sequelize, Options } from 'sequelize';
import Logger from '../../lib/logger';

const SqlFormatter = require('sql-formatter');
const _ = require('lodash');

const maxPoolConnections = 
  process.env.DATABASE_CONFIG_MAX_POOL_CONNECTIONS && 
  parseInt(process.env.DATABASE_CONFIG_MAX_POOL_CONNECTIONS) || 20;

const minPoolConnections = 
  process.env.DATABASE_CONFIG_MIN_POOL_CONNECTIONS && 
  parseInt(process.env.DATABASE_CONFIG_MIN_POOL_CONNECTIONS) || 0;

const idle = 
  process.env.DATABASE_CONFIG_MAX_IDLE_CONNECTION_TIME_MS &&
  parseInt(process.env.DATABASE_CONFIG_MAX_IDLE_CONNECTION_TIME_MS) || 20000;

const acquire = 
  process.env.DATABASE_CONFIG_MAX_ACQUIRE_CONNECTION_TIME_MS &&
  parseInt(process.env.DATABASE_CONFIG_MAX_ACQUIRE_CONNECTION_TIME_MS) || 20000;

export default class Database {
  private static instance: Sequelize;

  static getInstance(config: any): Sequelize {
    if (Database.instance) {
      return Database.instance;
    }

    const logger = Logger.getInstance();

    const defaultSettings: Partial<Options> = {
      pool: {
        max: maxPoolConnections,
        min: minPoolConnections,
        idle,
        acquire,
      },
      logging: (content: string) => {
        const parse = content.match(/^(Executing \(.*\):) (.*)$/);
        if (parse) {
          const prettySql = SqlFormatter.format(parse[2]);
          logger.debug(`${parse[1]}\n${prettySql}`);
        } else {
          logger.debug(`Could not parse sql content: ${content}`);
        }
      },
    };

    logger.info('Database connection started with the following config:' + JSON.stringify(defaultSettings));

    const sequelizeSettings: Options = _.merge(defaultSettings, config.sequelizeConfig);

    const instance = new Sequelize(config.name, config.user, config.password, sequelizeSettings);

    instance
      .authenticate()
      .then(() => {
        logger.info('Connected to database');
      })
      .catch((err) => {
        logger.error('Database connection error:', err);
      });

    Database.instance = instance;

    return instance;
  }
}
