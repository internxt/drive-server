const Sequelize = require('sequelize');
const SqlFormatter = require('sql-formatter');
const Logger = require('../../lib/logger');

const logger = Logger.getInstance();

module.exports = (config) => {
  const instance = new Sequelize(config.name, config.user, config.password, config.sequelizeConfig || {
    dialect: 'mariadb',
    port: config.port || 3306,
    replication: {
      read: [
        { host: process.env.RDS_HOSTNAME2, username: config.user, password: config.password },
        { host: process.env.RDS_HOSTNAME3, username: config.user, password: config.password }
      ],
      write: {
        host: config.host,
        username: config.user,
        password: config.password
      }
    },
    resetAfterUse: true,
    operatorsAliases: 0,
    dialectOptions: {
      options: {
        requestTimeout: 4000
      }
    },
    pool: {
      maxConnections: Number.MAX_SAFE_INTEGER,
      maxIdleTime: 30000,
      max: 10,
      min: 0,
      idle: 20000,
      acquire: 20000
    },
    logging: (content) => {
      const parse = content.match(/^(Executing \(.*\):) (.*)$/);
      const prettySql = SqlFormatter.format(parse[2]);
      logger.debug(`${parse[1]}\n${prettySql}`);
    }
  });

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
