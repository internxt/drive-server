"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var winston_1 = __importDefault(require("winston"));
var os_1 = __importDefault(require("os"));
var config_1 = __importDefault(require("../config/config"));
var config = config_1.default.getInstance();
var loggerOptions = {
    levels: {
        sql: 0,
        warn: 1,
        debug: 2,
        error: 3,
        info: 4
    }
};
function parseLogLevel(level) {
    var levelNames = Object.keys(loggerOptions.levels);
    var valueIndex = Object.values(loggerOptions.levels).indexOf(level);
    if (valueIndex === -1) {
        return levelNames[levelNames.length - 1];
    }
    return levelNames[valueIndex];
}
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger.getInstance = function () {
        if (!Logger.instance) {
            Logger.instance = loggerInstance(config.get('logger'));
        }
        return Logger.instance;
    };
    return Logger;
}());
exports.default = Logger;
var loggerInstance = function (config) {
    var levelName = parseLogLevel(config.level);
    var hostName = os_1.default.hostname();
    var colorize = winston_1.default.format.colorize({ all: true });
    return winston_1.default.createLogger({
        level: levelName,
        exitOnError: true,
        handleExceptions: true,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.splat(), winston_1.default.format.printf(function (info) {
            return info.timestamp + " " + hostName + " " + colorize.colorize(info.level, info.level + ": " + info.message);
        })),
        transports: [
            new winston_1.default.transports.Console()
        ]
    });
};
