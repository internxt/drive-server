const Winston = require('winston');

const Logger = Config => {
    return Winston.createLogger(
        {
            level: Config.level,
            format: Winston.format.combine(
                Winston.format.colorize({ all: true }),
                Winston.format.timestamp({ format: 'YYYY-MM-DD HH:MM:SS' }),
                Winston.format.printf(info => {
                    return `${info.timestamp} ${info.level}: ${info.message}`;
                })
            ),
            transports: [
                new Winston.transports.Console()
            ]
        }
    )
}

module.exports = Logger;