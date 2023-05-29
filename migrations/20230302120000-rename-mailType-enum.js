module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('ALTER TYPE enum_mail_limits_mail_type RENAME TO mail_type;');
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query('ALTER TYPE mail_type RENAME TO enum_mail_limits_mail_type;');
  },
};
