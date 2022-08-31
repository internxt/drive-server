exports.data = {
  server: {
    port: 8000,
  },
  database: {
    name: process.env.RDS_DBNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    sequelizeConfig: {
      dialect: 'postgres',
      port: 3306,
      host: process.env.RDS_HOSTNAME,
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
    level: 2,
  },
  STORJ_BRIDGE: process.env.STORJ_BRIDGE,
};
