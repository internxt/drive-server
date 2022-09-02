'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // When SELECT required use 0 or 1, but in setter use true or false
    await queryInterface.addColumn('folders', 'deleted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('folders', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('folders', 'deleted');
    await queryInterface.removeColumn('folders', 'deleted_at');
  },
};
