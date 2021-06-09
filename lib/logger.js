const Winston = require('winston');
const os = require('os');
const Config = require('../config/config');

const config = Config.getInstance();

const loggerOptions = {
  levels: {
    sql: 0,
    warn: 1,
    debug: 2,
    error: 3,
    info: 4
  }
};

function parseLogLevel(level) {
  const levelNames = Object.keys(loggerOptions.levels);
  const valueIndex = Object.values(loggerOptions.levels).indexOf(level);
  if (valueIndex === -1) {
    return levelNames[levelNames.length - 1];
  }
  return levelNames[valueIndex];
}

const LoggerInstance = (loggerConfig) => {
  const levelName = parseLogLevel(loggerConfig.level);
  const hostName = os.hostname();
  const colorize = Winston.format.colorize({ all: true });
  return Winston.createLogger({
    level: levelName,
    exitOnError: true,
    handleExceptions: true,
    format: Winston.format.combine(
      Winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      Winston.format.splat(),
      Winston.format.printf((info) => {
        return `${info.timestamp} ${hostName} ` + colorize.colorize(info.level, `${info.level}: ${info.message}`);
      })
    ),
    transports: [
      new Winston.transports.Console()
    ]
  });
};

class Logger {
  static getInstance() {
    if (!global.LoggerInstance) {
      global.LoggerInstance = LoggerInstance(config.get('logger'));
    }
    return global.LoggerInstance;
  }
}

module.exports = Logger;
