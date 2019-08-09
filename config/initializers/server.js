const assert = require('assert')
const express = require('express')
const Logger = require('../../lib/logger')
const Config = require('../index')
const Database = require('./database')

/**
 * Instance of Server application
 * @param {Config} config
 */
const Server = function(config) {
  if (!(this instanceof Server)) {
    return new Server()
  }

  assert(config instanceof Config, 'Invalid config supplied')

  this.config = config
  this.logger = Logger(this.config.get('logger'))
  this.express = express()
  this.router = express.Router()
  this.instance = null
  this.database = null
  this.models = null
  this.services = null
  this.routes = null


  return this
}

/**
 * Start Server instance
 * @param {Function} callback
 */
Server.prototype.start = function(callback) {
  const port = this.config.get('server:port')
  this.logger.info(`Starting Server on port ${port}`);
  this.logger.info(`Environment: "${process.env.NODE_ENV}"`);
  this.instance = this.express.listen(port, callback);
  this.initDatabase();

  process.on('SIGINT', this.handleSIGINT.bind(this))
  process.on('exit', this.handleExit.bind(this))
  process.on('uncaughtException', this.handleuncaughtException.bind(this))

  this.logger.info(`Server started on port: ${port}`)
  this.logger.info(`Brigde location: ${this.config.get('STORJ_BRIDGE')}`)
}

/**
 * Handles uncaught exception
 * @private
 */
Server.prototype.handleuncaughtException = function(err) {
  this.logger.info('Unhandled exception: %s\n%s', err.message, err.stack);
  process.exit(1);
}

/**
 * Handles exit event from process
 * @private
 */
Server.prototype.handleExit = function() {
  this.logger.info('Server is shutting down');
}

/**
 * Prevents new request until old one are done and fires exit signal
 * @private
 */
Server.prototype.handleSIGINT = function() {
  this.logger.info('Server received shutdown request, waiting for pending requests');
  this.instance.close(function() {
    this.logger.info('Finished all requests');
    process.exitCode = 0;
  })
}

/**
 * Initialize database connection
 * @private
 */
Server.prototype.initDatabase = function() {
  this.logger.info('Connecting to database');
  this.database = Database(this.config.get('database'), this.logger);
}

Server.prototype.initModels = function(Models) {
  this.logger.info('Initializing Models');
  this.models = Models(this.database, this)
  this.logger.info('Models OK')
}

Server.prototype.initServices = function(Services) {
  this.logger.info('Initializing services')
  this.services = Services(this.models, this)
  this.logger.info('Services OK')
}

Server.prototype.initMiddleware = function(Middleware) {
  this.logger.info('Initializing middleware')
  Middleware(this, this.config.get('secrets'))
  this.logger.info('Middleware OK')
}

Server.prototype.initRoutes = function(Router) {
  const routesPrefix = '/api'
  this.logger.info(`Initializing and mounting routes to ${routesPrefix}`)
  this.routes = Router(this.router, this.services, this.logger, this)
  this.express.use(routesPrefix, this.routes)
  this.logger.info('Routes OK')
}

module.exports = Server
