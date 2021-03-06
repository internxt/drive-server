const Sequelize = require('sequelize');
const SqlFormatter = require('sql-formatter');
const Logger = require('../../lib/logger');

const logger = Logger.getInstance();

module.exports = (config) => {
  const instance = new Sequelize(config.name, config.user, config.password, {
    host: config.host,
    dialect: 'mariadb',
    resetAfterUse: true,
    operatorsAliases: 0,
    dialectOptions: {
      options: {
        requestTimeout: 4000
      }
    },
    pool: {
      max: 10,
      min: 0,
      idle: 10000
    },
    logging: (content) => {
      const parse = content.match(/^(Executing \(.*\):) (.*)$/);
      const prettySql = SqlFormatter.format(parse[2]);
      logger.debug(`${parse[1]}\n${prettySql}`);
    }
  });

  instance.authenticate().then(() => {
    logger.info('Connected to database');
  }).catch((err) => logger.error(err));

  return {
    instance,
    Sequelize
  };
};
