const fs = require('fs')
const path = require('path')

const basename = path.basename(__filename)

module.exports = (Model, App) => {
  const services = {}
  const Logger = App.logger
  try {
    fs
      .readdirSync(__dirname)
      .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
      .forEach((file) => {
        const service = require(path.join(__dirname, file))(Model, App)
        services[service.Name] = service
      })
    Logger.info('Services loaded')
    return services
  } catch (error) {
    Logger.error(error)
    throw new Error(error)
  }
}
