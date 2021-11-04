"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var nconf_1 = __importDefault(require("nconf"));
var development = require('./environments/development.js').data;
var test = require('./environments/test.js').data;
var staging = require('./environments/staging.js').data;
var environments = { development: development, test: test, staging: staging };
var Config = /** @class */ (function () {
    function Config() {
        // eslint-disable-next-line global-require
        nconf_1.default.argv();
        nconf_1.default.env();
        nconf_1.default.required(['NODE_ENV']);
        nconf_1.default.use('conf', {
            type: 'literal',
            // eslint-disable-next-line global-require
            store: environments[nconf_1.default.get('NODE_ENV')]
        });
        nconf_1.default.required(['server:port']);
    }
    Config.getInstance = function () {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    };
    Config.prototype.get = function (key) {
        return nconf_1.default.get(key);
    };
    return Config;
}());
exports.default = Config;
