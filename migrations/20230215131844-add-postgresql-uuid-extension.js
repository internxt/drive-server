'use strict';

/**
 * While Postgres out-of-the-box supports storing UUID (Universally Unique Identifier) values in their native 128-bit form, 
 * generating UUID values requires a plug-in. In Postgres, a plug-in is known as an extension.
 * 
 * To install an extension, call CREATE EXTENSION. To avoid re-installing, add IF NOT EXISTS.
 * 
 * The extension we want is an open-source library built in C for working with UUIDs, OSSP uuid.
 * A build of this library for Postgres is often bundled with an installation of Postgres such as the graphical installers provided 
 * by Enterprise DB or included by cloud providers such as Amazon RDS for PostgreSQL.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS "uuid-ossp";');
  }
};
