const Config = require('~config/config');
const Server = require('~config/initializers/server');
const Routes = require('~routes/routes');
const Models = require('~models/models');
const Services = require('~services/services');
const Middleware = require('~config/initializers/middleware');

const config = new Config();
const App = new Server(config);

/**
 * Start application and inject components
 */
App.start(() => {
  App.initMiddleware(Middleware);
  App.initModels(Models);
  App.initServices(Services);
  App.initRoutes(Routes);
});
