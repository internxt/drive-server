'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('shares', 'file_token', {
      type: Sequelize.STRING(64),
      allowNull: false
    })
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('shares', 'file_token');
  }
};
