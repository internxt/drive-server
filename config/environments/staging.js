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
    JWT: process.env.JWT_SECRET || 'asdf1234',
    CRYPTO: 'asdf1234',
    CAPTCHA: process.env.CAPTCHA_SECRET,
    CRYPTO_SECRET: process.env.CRYPTO_SECRET || 'ASDFGHJKL1234567',
    STRIPE_SK: process.env.STRIPE_SK
  },
  logger: {
    level: 0
  },
  STORJ_BRIDGE: 'https://api.internxt.com'
}
