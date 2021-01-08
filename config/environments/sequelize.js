module.exports = {
  development: {
    dialect: 'mysql',
    database: 'xcloud_server_dev',
    username: 'developer',
    password: 'asdf1234',
    host: 'localhost'
  },
  test: {
    username: 'root',
    password: null,
    database: 'database_test',
    host: '127.0.0.1',
    dialect: 'mysql'
  },
  staging: {
    host: process.env.RDS_HOSTNAME,
    database: process.env.RDS_DBNAME,
    username: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    dialect: 'mysql'
  }
};
