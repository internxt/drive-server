module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('keyserver', 'public_key', { type: Sequelize.STRING(1024) });
    await queryInterface.changeColumn('keyserver', 'private_key', { type: Sequelize.STRING(2000) });
    await queryInterface.changeColumn('keyserver', 'revocation_key', { type: Sequelize.STRING(1024) });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('keyserver', 'public_key', { type: Sequelize.STRING(920) });
    await queryInterface.changeColumn('keyserver', 'private_key', { type: Sequelize.STRING(1356) });
    await queryInterface.changeColumn('keyserver', 'revocation_key', { type: Sequelize.STRING(476) });
  }
};
