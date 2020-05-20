exports.data = {
  server: {
    port: 3007,
  },
  database: {
    name: 'xcloud_server_dev',
    user: 'developer',
    password: 'asdf1234',
    host: 'localhost',
  },
  secrets: {
    JWT: process.env.JWT_SECRET || 'asdf1234',
    CRYPTO: 'asdf1234',
    CAPTCHA: process.env.CAPTCHA_SECRET,
    CRYPTO_SECRET: process.env.CRYPTO_SECRET || 'ASDFGHJKL1234567',
    STRIPE_SK: process.env.STRIPE_SK,
  },
  logger: {
    level: 0,
  },
  STORJ_BRIDGE: 'https://api.internxt.com',
}
