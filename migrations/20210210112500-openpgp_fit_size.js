module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('keyserver', 'public_key', { type: Sequelize.STRING(1024) }),
      queryInterface.changeColumn('keyserver', 'private_key', { type: Sequelize.STRING(2000) }),
      queryInterface.changeColumn('keyserver', 'revocation_key', { type: Sequelize.STRING(1024) })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('keyserver', 'public_key', { type: Sequelize.STRING(920) }),
      queryInterface.changeColumn('keyserver', 'private_key', { type: Sequelize.STRING(1356) }),
      queryInterface.changeColumn('keyserver', 'revocation_key', { type: Sequelize.STRING(476) })
    ]);
  }
};
