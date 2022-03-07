module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('shares', 'encryption_key', {
      type: Sequelize.STRING(400)
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('shares', 'encryption_key', {
      type: Sequelize.STRING(64)
    });
  },

};