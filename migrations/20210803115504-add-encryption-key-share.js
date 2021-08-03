'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('shares', 'encryption_key', {
      type: Sequelize.STRING(64),
      allowNull: false
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('shares', 'encryption_key')
  }
};
