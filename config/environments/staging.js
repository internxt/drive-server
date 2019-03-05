exports.data = {
  server: {
    port: 8000
  },
  database: {
    host: process.env.RDS_HOSTNAME,
    name: process.env.RDS_DBNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD
  },
  secrets: {
    JWT: 'asdf1234',
    CRYPTO: 'asdf1234',
    CAPTCHA: process.env.CAPTCHA_SECRET
  },
  logger: {
    level: 0
  },
  STORJ_BRIDGE: 'https://api.internxt.com'
}
