"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstance = void 0;
var sequelize_1 = require("sequelize");
var logger_1 = __importDefault(require("../../lib/logger"));
var SqlFormatter = require('sql-formatter');
var _ = require('lodash');
var Database = /** @class */ (function () {
    function Database() {
    }
    Database.getInstance = function (config) {
        if (Database.instance) {
            return Database.instance;
        }
        var logger = logger_1.default.getInstance();
        var defaultSettings = {
            resetAfterUse: true,
            operatorsAliases: 0,
            dialectOptions: {
                connectTimeout: 20000,
                options: {
                    requestTimeout: 4000
                }
            },
            pool: {
                maxConnections: Number.MAX_SAFE_INTEGER,
                maxIdleTime: 30000,
                max: 20,
                min: 0,
                idle: 20000,
                acquire: 20000
            },
            logging: function (content) {
                var parse = content.match(/^(Executing \(.*\):) (.*)$/);
                var prettySql = SqlFormatter.format(parse[2]);
                logger.debug(parse[1] + "\n" + prettySql);
            }
        };
        var sequelizeSettings = _.merge(defaultSettings, config.sequelizeConfig);
        var instance = new sequelize_1.Sequelize(config.name, config.user, config.password, sequelizeSettings);
        instance.authenticate().then(function () {
            logger.info('Connected to database');
        }).catch(function (err) {
            logger.error('Database connection error: %s', err);
        });
        Database.instance = instance;
        return instance;
    };
    return Database;
}());
exports.default = Database;
function getInstance(logger, config) {
    var defaultSettings = {
        resetAfterUse: true,
        operatorsAliases: 0,
        dialectOptions: {
            connectTimeout: 20000,
            options: {
                requestTimeout: 4000
            }
        },
        pool: {
            maxConnections: Number.MAX_SAFE_INTEGER,
            maxIdleTime: 30000,
            max: 20,
            min: 0,
            idle: 20000,
            acquire: 20000
        },
        logging: function (content) {
            var parse = content.match(/^(Executing \(.*\):) (.*)$/);
            var prettySql = SqlFormatter.format(parse[2]);
            logger.debug(parse[1] + "\n" + prettySql);
        }
    };
    var sequelizeSettings = _.merge(defaultSettings, config.sequelizeConfig);
    var instance = new sequelize_1.Sequelize(config.name, config.user, config.password, sequelizeSettings);
    instance.authenticate().then(function () {
        logger.info('Connected to database');
    }).catch(function (err) {
        logger.error('Database connection error: %s', err);
    });
    return instance;
}
exports.getInstance = getInstance;
