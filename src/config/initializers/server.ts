import express from 'express';
import http from 'http';
import { Sequelize } from 'sequelize';
import winston from 'winston';

import Config from '../config';
import Logger from '../../lib/logger';
import Database from './database';

import initModels, { ModelType } from '../../app/models';
import errorHandler from '../../app/middleware/error-handler';

// TODO: Remove when the Express@5 release comes
import 'express-async-errors';

/**
 * Instance of Server application
 * @param {Config} config
 */
export default class Server {
  express: express.Express;
  router: express.Router;
  instance: http.Server | null;
  config: Config;
  database: Sequelize | null;
  models: Record<string, ModelType> | null;
  services: any;
  routes: any;
  logger: winston.Logger;

  constructor() {
    this.config = Config.getInstance();
    this.logger = Logger.getInstance(this.config.get('logger'));
    this.express = express();
    this.router = express.Router();
    this.instance = null;
    this.database = null;
    this.models = null;
    this.services = null;
    this.routes = null;
  }

  start(callback: () => void) {
    const port = this.config.get('server:port');
    this.logger.info(`Starting Server on port ${port}`);
    this.logger.info(`Environment: "${process.env.NODE_ENV}"`);
    this.instance = this.express.listen(port, '0.0.0.0', callback);
    this.initDatabase();

    process.on('SIGINT', this.handleSIGINT.bind(this));
    process.on('exit', this.handleExit.bind(this));
    process.on('uncaughtException', this.handleuncaughtException.bind(this));

    this.logger.info(`API started on: http://localhost:${port}`);
    this.logger.info(`Bridge location: ${this.config.get('STORJ_BRIDGE')}`);
  }

  stop() {
    this.instance?.close();
    this.database?.close();
  }

  handleuncaughtException(err: Error) {
    this.logger.info(`Unhandled exception: ${err.message}\n${err.stack}`);
    this.database?.close();
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  handleExit() {
    this.logger.info('Server is shutting down');
  }

  handleSIGINT() {
    this.logger.info('Server received shutdown request, waiting for pending requests');
    this.instance?.close(() => {
      this.logger.info('Finished all requests');
      process.exitCode = 0;
    });
    this.services.Apn?.close();
  }

  initDatabase() {
    this.logger.info('Connecting to database');
    this.database = Database.getInstance(this.config.get('database'));
  }

  initModels() {
    this.logger.info('Initializing Models');
    if (!this.database) {
      throw new Error('Database not initialized');
    }
    this.models = initModels(this.database);
    this.logger.info('Models OK');
  }

  initServices(Services: any) {
    this.logger.info('Initializing services');
    this.services = Services(this.models, this);
    this.logger.info('Services OK');
  }

  initMiddleware(Middleware: any) {
    this.logger.info('Initializing middlewares');
    Middleware(this, this.config.get('secrets'));
    this.logger.info('Middleware OK');
  }

  initSocketServer(SocketServer: any) {
    this.logger.info('Initializing socket server');
    SocketServer(this, this.services);
    this.logger.info('Socket Server OK');
  }

  initRoutes(Router: any) {
    const routesPrefix = '/api';
    this.logger.info(`Initializing and mounting routes to ${routesPrefix}`);
    this.routes = Router(this.router, this.services, this);
    this.express.use(routesPrefix, this.routes);
    this.express.use(errorHandler);
    this.logger.info('Routes OK');
  }
}

module.exports = Server;
