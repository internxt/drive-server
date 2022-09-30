exports.data = {
  server: {
    port: 3007,
  },
  database: {
    name: 'drive_test',
    user: 'developer',
    password: 'asdf1234',
    host: 'localhost',
  },
  secrets: {
    JWT: 'asdf1234',
    CRYPTO_SECRET: 'asdf1234',
    MAGIC_IV: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    MAGIC_SALT:
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  },
  logger: {
    level: 'emerg',
  },
  STORJ_BRIDGE: 'http://localhost:6382',
};
