"use strict";
module.exports = {
    development: {
        dialect: 'mariadb',
        host: process.env.RDS_HOSTNAME,
        database: process.env.RDS_DBNAME,
        username: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        logging: true
    },
    test: {
        username: 'root',
        password: null,
        database: 'drive_test',
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
