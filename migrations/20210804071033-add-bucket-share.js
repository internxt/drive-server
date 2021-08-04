'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('shares', 'bucket', {
      type: Sequelize.STRING(24),
      allowNull: false
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('shares', 'bucket')
  }
};
