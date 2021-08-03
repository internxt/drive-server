'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.addConstraint('shares', {
      type: 'UNIQUE',
      fields: ['token'],
      name: 'token_UNIQUE'
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeConstraint('shares', 'token_UNIQUE');
  }
};
