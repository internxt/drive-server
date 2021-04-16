const async = require('async');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint('keyserver', 'keyserver_ibfk_1')
      .then(() => queryInterface.addConstraint('keyserver', {
        type: 'FOREIGN KEY',
        fields: ['user_id'],
        name: 'keyserver_ibfk_1',
        references: {
          table: 'users',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }));
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint('keyserver', 'keyserver_ibfk_1')
      .then(() => queryInterface.addConstraint('keyserver', {
        type: 'FOREIGN KEY',
        fields: ['user_id'],
        name: 'keyserver_ibfk_1',
        references: {
          table: 'users',
          field: 'id'
        }
      }));
  }
};
