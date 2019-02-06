'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'name', { type: Sequelize.STRING }).then(function () {
      return queryInterface.addColumn('users', 'lastname', { type: Sequelize.STRING }).then(function () {
        return queryInterface.addColumn('users','password', { type: Sequelize.STRING });
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'name').then(function () {
      return queryInterface.removeColumn('users', 'lastname').then(function () {
        return queryInterface.removeColumn('users', 'password');
      });
    });
  }
};
