const Sequelize = require('sequelize');
const SqlFormatter = require('sql-formatter');
const _ = require('lodash');
const Logger = require('../../lib/logger');

const logger = Logger.getInstance();

module.exports = (config) => {
  const defaultSettings = {
    resetAfterUse: true,
    operatorsAliases: 0,
    dialectOptions: {
      connectTimeout: 20000,
      options: {
        requestTimeout: 4000
      }
    },
    pool: {
      maxConnections: Number.MAX_SAFE_INTEGER,
      maxIdleTime: 30000,
      max: 20,
      min: 0,
      idle: 20000,
      acquire: 20000
    },
    logging: (content) => {
      const parse = content.match(/^(Executing \(.*\):) (.*)$/);
      const prettySql = SqlFormatter.format(parse[2]);
      logger.debug(`${parse[1]}\n${prettySql}`);
    }
  };

  const sequelizeSettings = _.merge(defaultSettings, config.sequelizeConfig);

  const instance = new Sequelize(config.name, config.user, config.password, sequelizeSettings);

  instance.authenticate().then(() => {
    logger.info('Connected to database');
  }).catch((err) => {
    logger.error('Database connection error: %s', err);
  });

  return {
    instance,
    Sequelize
  };
};
