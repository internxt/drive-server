'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'hKey', 
      {
        type: Sequelize.BLOB('medium'),
        allowNull: false
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users','hKey');
  }
};
