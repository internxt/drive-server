"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var config_1 = __importDefault(require("../config"));
var logger_1 = __importDefault(require("../../lib/logger"));
var database_1 = __importDefault(require("./database"));
var models_1 = __importDefault(require("../../app/models"));
/**
 * Instance of Server application
 * @param {Config} config
 */
var Server = /** @class */ (function () {
    function Server() {
        this.config = config_1.default.getInstance();
        this.logger = logger_1.default.getInstance();
        this.express = (0, express_1.default)();
        this.router = express_1.default.Router();
        this.instance = null;
        this.database = null;
        this.models = null;
        this.services = null;
        this.routes = null;
    }
    Server.prototype.start = function (callback) {
        var port = this.config.get('server:port');
        this.logger.info("Starting Server on port " + port);
        this.logger.info("Environment: \"" + process.env.NODE_ENV + "\"");
        this.instance = this.express.listen(port, '0.0.0.0', callback);
        this.initDatabase();
        process.on('SIGINT', this.handleSIGINT.bind(this));
        process.on('exit', this.handleExit.bind(this));
        process.on('uncaughtException', this.handleuncaughtException.bind(this));
        this.logger.info("API started on: http://localhost:" + port);
        this.logger.info("Bridge location: " + this.config.get('STORJ_BRIDGE'));
    };
    Server.prototype.handleuncaughtException = function (err) {
        this.logger.info('Unhandled exception: %s\n%s', err.message, err.stack);
        // eslint-disable-next-line no-process-exit
        process.exit(1);
    };
    Server.prototype.handleExit = function () {
        this.logger.info('Server is shutting down');
    };
    Server.prototype.handleSIGINT = function () {
        var _this = this;
        var _a;
        this.logger.info('Server received shutdown request, waiting for pending requests');
        (_a = this.instance) === null || _a === void 0 ? void 0 : _a.close(function () {
            _this.logger.info('Finished all requests');
            process.exitCode = 0;
        });
    };
    Server.prototype.initDatabase = function () {
        this.logger.info('Connecting to database');
        this.database = database_1.default.getInstance(this.config.get('database'));
    };
    Server.prototype.initModels = function () {
        this.logger.info('Initializing Models');
        if (!this.database) {
            throw new Error('Database not initialized');
        }
        this.models = (0, models_1.default)(this.database);
        this.logger.info('Models OK');
    };
    Server.prototype.initServices = function (Services) {
        this.logger.info('Initializing services');
        this.services = Services(this.models, this);
        this.logger.info('Services OK');
    };
    Server.prototype.initMiddleware = function (Middleware) {
        this.logger.info('Initializing middlewares');
        Middleware(this, this.config.get('secrets'));
        this.logger.info('Middleware OK');
    };
    Server.prototype.initSocketServer = function (SocketServer) {
        this.logger.info('Initializing socket server');
        SocketServer(this, this.services);
        this.logger.info('Socket Server OK');
    };
    Server.prototype.initRoutes = function (Router) {
        var routesPrefix = '/api';
        this.logger.info("Initializing and mounting routes to " + routesPrefix);
        this.routes = Router(this.router, this.services, this);
        this.express.use(routesPrefix, this.routes);
        this.logger.info('Routes OK');
    };
    return Server;
}());
exports.default = Server;
module.exports = Server;
