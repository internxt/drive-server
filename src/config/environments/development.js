exports.data = {
  server: {
    port: 8000,
  },
  database: {
    host: process.env.RDS_HOSTNAME,
    name: process.env.RDS_DBNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    sequelizeConfig: {
      host: process.env.RDS_HOSTNAME,
      dialect: 'postgres',
      port: process.env.RDS_PORT,
    },
  },
  secrets: {
    JWT: process.env.JWT_SECRET || 'asdf1234',
    CRYPTO: 'asdf1234',
    CAPTCHA: process.env.CAPTCHA_SECRET,
    CRYPTO_SECRET: process.env.CRYPTO_SECRET || 'ASDFGHJKL1234567',
    STRIPE_SK: process.env.STRIPE_SK,
    CAPTCHA_SECRET: process.env.CAPTCHA_SECRET,
    MAGIC_SALT: process.env.MAGIC_SALT,
    MAGIC_IV: process.env.MAGIC_IV,
    CRYPTO_SECRET2: process.env.CRYPTO_SECRET2,
  },
  logger: {
    level: 'info',
  },
  STORJ_BRIDGE: 'https://api.internxt.com',
};
