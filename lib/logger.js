const Winston = require('winston');
const Config = require('../config/config');

const config = Config.getInstance();

const LoggerInstance = (loggerConfig) => Winston.createLogger({
  level: loggerConfig.level || 0,
  format: Winston.format.combine(Winston.format.colorize({ all: true }),
    Winston.format.timestamp({ format: 'YYYY-MM-DD HH:MM:SS' }),
    Winston.format.splat(),
    Winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)),
  transports: [new Winston.transports.Console()]
});

class Logger {
  static getInstance() {
    if (!global.LoggerInstance) {
      global.LoggerInstance = LoggerInstance(config.get('logger'));
    }
    return global.LoggerInstance;
  }
}

module.exports = Logger;
