exports.data = {
  server: {
    port: 3007
  },
  database: {
    name: 'xcloud_server_dev',
    user: 'developer',
    password: 'asdf1234',
    host: 'localhost'
  },
  secrets: {
    JWT: 'asdf1234',
    CRYPTO_SECRET: 'asdf1234',
    MAGIC_IV: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    MAGIC_SALT: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  },
  logger: {
    level: 0
  },
  STORJ_BRIDGE: 'http://localhost:6382'
};
