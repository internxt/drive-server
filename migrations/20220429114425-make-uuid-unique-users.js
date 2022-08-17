'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.addConstraint('users', {
      type: 'UNIQUE',
      fields: ['uuid'],
      name: 'uuid_UNIQUE',
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeConstraint('users', 'uuid_UNIQUE');
  },
};
