module.exports = {
  development: {
    dialect: 'mariadb',
    database: 'xcloud_server_dev',
    username: 'root',
    password: '',
    host: 'localhost'
  },
  test: {
    username: 'root',
    password: null,
    database: 'database_test',
    host: '127.0.0.1',
    dialect: 'mariadb'
  },
  staging: {
    host: process.env.RDS_HOSTNAME,
    database: process.env.RDS_DBNAME,
    username: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    dialect: 'mariadb'
  }
};
