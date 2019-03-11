'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'hKey', 
    { 
      type: Sequelize.STRING, 
      allowNull: false,
      defaultValue: '0000'
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users','hKey');
  }
};
