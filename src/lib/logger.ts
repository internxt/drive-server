import winston from 'winston';
import os from 'os';
import Config from '../config/config';

const { splat, combine, printf, timestamp } = winston.format;

const serverHostname = os.hostname();
const colorize = winston.format.colorize({ all: true });

const winstonProdOptions: winston.LoggerOptions = {
  level: 'info',
  exitOnError: true,
  handleExceptions: true,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    printf((info) => {
      return JSON.stringify({
        hostname: serverHostname,
        requestId: (info.meta && info.meta.requestId) ?? '0',
        timestamp: info.timestamp,
        level: info.level,
        message: info.message,
        meta: info.meta ?? {},
      });
    }),
  ),
  transports: [new winston.transports.Console()],
};

const winstonDevOptions: winston.LoggerOptions = {
  level: 'info',
  exitOnError: true,
  handleExceptions: true,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    splat(),
    printf((info) => {
      const message = colorize.colorize(info.level, `${info.level}: ${info.message}`);
      return `${info.timestamp} ${serverHostname} ${message}`;
    }),
  ),
  transports: [new winston.transports.Console()],
};

export default class Logger {
  private static instance: winston.Logger;

  static getInstance(): winston.Logger {
    if (!Logger.instance) {
      Logger.instance = loggerInstance();
    }

    return Logger.instance;
  }
}

const loggerInstance = (): winston.Logger => {
  if (process.env.NODE_ENV === 'development') {
    return winston.createLogger(winstonDevOptions);
  }
  return winston.createLogger(winstonProdOptions);
};
