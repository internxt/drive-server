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
      dialect: 'postgres',
      port: process.env.RDS_PORT,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      replication: {
        read: [
          { host: process.env.RDS_HOSTNAME, username: process.env.RDS_USERNAME, password: process.env.RDS_PASSWORD },
          { host: process.env.RDS_HOSTNAME2, username: process.env.RDS_USERNAME, password: process.env.RDS_PASSWORD },
          { host: process.env.RDS_HOSTNAME3, username: process.env.RDS_USERNAME, password: process.env.RDS_PASSWORD },
        ],
        write: {
          host: process.env.RDS_HOSTNAME,
          username: process.env.RDS_USERNAME,
          password: process.env.RDS_PASSWORD,
        },
      },
    },
  },
  secrets: {
    JWT: process.env.JWT_SECRET || 'asdf1234',
    CRYPTO: 'asdf1234',
    CAPTCHA: process.env.CAPTCHA_SECRET,
    CRYPTO_SECRET: process.env.CRYPTO_SECRET || 'ASDFGHJKL1234567',
    STRIPE_SK: process.env.STRIPE_SK,
    MAGIC_SALT: process.env.MAGIC_SALT,
    MAGIC_IV: process.env.MAGIC_IV,
    CRYPTO_SECRET2: process.env.CRYPTO_SECRET2,
  },
  logger: {
    level: 4,
  },
  STORJ_BRIDGE: 'https://api.internxt.com',
};
