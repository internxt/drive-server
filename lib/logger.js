const Winston = require('winston');

const Logger = (Config) => Winston.createLogger({
    level: Config.level || 0,
    format: Winston.format.combine(
        Winston.format.colorize({ all: true }),
        Winston.format.timestamp({ format: 'YYYY-MM-DD HH:MM:SS' }),
        Winston.format.splat(),
        Winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [new Winston.transports.Console()]
});

module.exports = Logger;
