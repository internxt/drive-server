exports.data = {
  server: {
    port: 8000
  },
  database: {
    name: process.env.RDS_HOSTNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    host: process.env.RDS_PORT
  },
  secrets: {
    JWT: "asdf1234"
  },
  logger: {
    level: 0
  }
}