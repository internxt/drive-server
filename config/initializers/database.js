const mongoose = require('mongoose')

module.exports = (config, Logger) => {
  const connection = mongoose.connection
  mongoose.connect(`mongodb://${config.host}:${config.port}/${config.name}`, { useNewUrlParser: true })

  connection.on('error', Logger.error)
  connection.once('open', () => {
    Logger.info(`Connected to database: ${config.name}`)
  })

  return {
    connection,
    mongoose
  }
}
