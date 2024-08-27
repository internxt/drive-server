import winston from 'winston';
import os from 'os';
import { isProduction } from '../config/environments/env';

const { splat, combine, printf, timestamp } = winston.format;

const serverHostname = os.hostname();
const colorize = winston.format.colorize({ all: true });

const winstonProdOptions: winston.LoggerOptions = {
  level: 'info',
  exitOnError: true,
  handleExceptions: true,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    splat(),
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

type LoggerConfig = {
  level: string;
}

export default class Logger {
  private static instance: winston.Logger;

  static getInstance(config?: LoggerConfig): winston.Logger {
    if (!Logger.instance) {
      Logger.instance = loggerInstance(config);
    }

    return Logger.instance;
  }
}

const loggerInstance = (config?: LoggerConfig): winston.Logger => {
  return winston.createLogger(isProduction() ? winstonProdOptions : {...winstonDevOptions, ...config});
};
