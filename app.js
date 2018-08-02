const Server = require('./config/initializers/server')
const Config = require('./config')
const Routes = require('./app/routes')
const Models = require('./app/models')
const Services = require('./app/services')
const Middleware = require('./config/initializers/middleware')

const config = new Config()
const App = new Server(config)

/**
 * Start application and inject components
 */
App.start(() => {
  App.initMiddleware(Middleware)
  App.initModels(Models)
  App.initServices(Services)
  App.initRoutes(Routes)
})
