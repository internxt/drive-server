'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'hKey', 
      {
        type: Sequelize.BLOB('medium'),
        allowNull: false,
        get() { return this.getDataValue('hKey').toString('utf8'); }
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users','hKey');
  }
};
