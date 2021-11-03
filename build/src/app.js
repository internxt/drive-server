"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
var server_1 = __importDefault(require("./config/initializers/server"));
var Routes = require('./app/routes/routes');
var Services = require('./app/services/services');
var Middleware = require('./config/initializers/middleware');
var SocketServer = require('./app/sockets/socketServer');
var App = new server_1.default();
App.start(function () {
    App.initMiddleware(Middleware);
    App.initModels();
    App.initServices(Services);
    App.initRoutes(Routes);
    App.initSocketServer(SocketServer);
});
