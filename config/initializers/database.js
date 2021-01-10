const Sequelize = require('sequelize');
const Logger = require('../../lib/logger');
const SqlFormatter = require('sql-formatter');

const logger = Logger.getInstance();

module.exports = (config) => {
  const instance = new Sequelize(config.name, config.user, config.password, {
    host: config.host,
    dialect: 'mysql',
    operatorsAliases: 0,
    logging: (content) => {
      const parse = content.match(/^(Executing \(.*\):) (.*)$/);
      const prettySql = SqlFormatter.format(parse[2]);
      logger.debug(`${parse[1]}\n${prettySql}`);
    }
  });

  instance
    .authenticate().then(() => logger.info('Connected to database')).catch((err) => logger.error(err));

  return {
    instance,
    Sequelize
  };
};
