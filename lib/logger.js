const Winston = require('winston')

const Logger = Config => new Winston.Logger({
  transports: [
    new Winston.transports.Console({
      colorize: true,
      timestamp: true,
      level: Config.level
    })
  ]
})

module.exports = Logger
