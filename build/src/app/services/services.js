"use strict";
/* eslint-disable global-require */
var fs = require('fs');
var path = require('path');
var basename = path.basename(__filename);
module.exports = function (Model, App) {
    var services = {};
    var log = App.logger;
    try {
        fs.readdirSync(__dirname)
            .filter(function (file) { return file.indexOf('.') !== 0
            && file !== basename
            && file.slice(-3) === '.js'; })
            .forEach(function (file) {
            var service = require(path.join(__dirname, file))(Model, App);
            services[service.Name] = service;
        });
        log.info('Services loaded');
        return services;
    }
    catch (error) {
        log.error(error);
        throw Error(error);
    }
};
