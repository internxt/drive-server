import { Sequelize, Options } from 'sequelize';
import Logger from '../../lib/logger';

const SqlFormatter = require('sql-formatter');
const _ = require('lodash');

export default class Database {
  private static instance: Sequelize;

  static getInstance(config: any): Sequelize {
    if (Database.instance) {
      return Database.instance;
    }

    const logger = Logger.getInstance();

    const defaultSettings = {
      resetAfterUse: true,
      operatorsAliases: 0,
      dialectOptions: {
        connectTimeout: 20000,
        options: {
          requestTimeout: 4000,
        },
      },
      pool: {
        maxConnections: Number.MAX_SAFE_INTEGER,
        maxIdleTime: 30000,
        max: 20,
        min: 0,
        idle: 20000,
        acquire: 20000,
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

    const sequelizeSettings: Options = _.merge(defaultSettings, config.sequelizeConfig);

    const instance = new Sequelize(config.name, config.user, config.password, sequelizeSettings);

    instance
      .authenticate()
      .then(() => {
        logger.info('Connected to database');
      })
      .catch((err) => {
        logger.error('Database connection error: %s', err);
      });

    Database.instance = instance;

    return instance;
  }
}
