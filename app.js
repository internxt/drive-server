const Config = require('./config/config');
const config = new Config();

const Server = require('./config/initializers/server');
const Routes = require('./app/routes/routes');
const Models = require('./app/models/models');
const Services = require('./app/services/services');
const Middleware = require('./config/initializers/middleware');

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
