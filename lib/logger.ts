import winston from 'winston';
import os from 'os';
import { config } from '../config/config';

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
        return `${info.timestamp} ${hostName} ${colorize.colorize(info.level, `${info.level}: ${info.message}`)}`;
      })
    ),
    transports: [
      new winston.transports.Console()
    ]
  });
};

export default loggerInstance(config.get('logger'));
