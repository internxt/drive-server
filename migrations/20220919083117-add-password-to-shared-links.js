'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('shares', 'hashed_password', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('send_links', 'hashed_password', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('shares', 'hashed_password');

    await queryInterface.removeColumn('send_links', 'hashed_password');
  },
};
