'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      `ALTER TYPE "mail_type" ADD VALUE 'email_verification'`
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      DELETE 
      FROM
        pg_enum
      WHERE
        enumlabel = 'email_verification' AND
        enumtypid = (
          SELECT
            oid
          FROM
            pg_type
          WHERE
            typname = 'email_verification'
        )
    `);
  }
};
