import winston from 'winston';
import os from 'os';
import Config from '../config/config';

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

function parseLogLevel(level: number): string {
  const levelNames = Object.keys(loggerOptions.levels);
  const valueIndex = Object.values(loggerOptions.levels).indexOf(level);
  if (valueIndex === -1) {
    return levelNames[levelNames.length - 1];
  }
  return levelNames[valueIndex];
}

interface LoggerConfig {
  level: number;
}

export default class Logger {
  private static instance: winston.Logger;

  static getInstance(): winston.Logger {
    if (!Logger.instance) {
      Logger.instance = loggerInstance(config.get('logger'));
    }

    return Logger.instance;
  }
}

const loggerInstance = (config: LoggerConfig): winston.Logger => {
  const levelName = parseLogLevel(config.level);
  const hostName = os.hostname();
  const colorize = winston.format.colorize({ all: true });
  return winston.createLogger({
    level: levelName,
    exitOnError: true,
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.splat(),
      winston.format.printf((info) => {
        const message = process.env.NODE_ENV !== 'development' ? 
          `${info.level}: ${info.message}` : 
          colorize.colorize(info.level, `${info.level}: ${info.message}`);
        return `${info.timestamp} ${hostName} ${message}`;
      })
    ),
    transports: [
      new winston.transports.Console()
    ]
  });
};
