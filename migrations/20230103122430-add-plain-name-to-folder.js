'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('folders', 'plain_name', {
      type: Sequelize.STRING(650),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('folders', 'plain_name');
  },
};
