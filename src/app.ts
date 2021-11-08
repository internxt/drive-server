require('dotenv').config();

import Server from './config/initializers/server';

const Routes = require('./app/routes/routes');
const Services = require('./app/services/services');
const Middleware = require('./config/initializers/middleware');
const SocketServer = require('./app/sockets/socketServer');

const App = new Server();

App.start(() => {
  App.initMiddleware(Middleware);
  App.initModels();
  App.initServices(Services);
  App.initRoutes(Routes);
  App.initSocketServer(SocketServer);
});
