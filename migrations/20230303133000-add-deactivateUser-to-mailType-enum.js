module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `ALTER TYPE mail_type ADD VALUE 'deactivate_user';`,
    );
  },
};
