const Sequelize = require('sequelize');
require('sequelize-hierarchy')(Sequelize);
const Logger = require('../../lib/logger');

const logger = Logger.getInstance();

module.exports = (config) => {
  const instance = new Sequelize(config.name, config.user, config.password, {
    host: config.host,
    dialect: 'mysql',
    operatorsAliases: 0,
    logging: (content) => logger.debug(content)
  });

  instance
    .authenticate().then(() => logger.info('Connected to database')).catch((err) => logger.error(err));

  return {
    instance,
    Sequelize
  };
};
