module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeConstraint('keyserver', 'keyserver_ibfk_1');
    await queryInterface.addConstraint('keyserver', {
      type: 'FOREIGN KEY',
      fields: ['user_id'],
      name: 'keyserver_ibfk_1',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeConstraint('keyserver', 'keyserver_ibfk_1');
    await queryInterface.addConstraint('keyserver', {
      type: 'FOREIGN KEY',
      fields: ['user_id'],
      name: 'keyserver_ibfk_1',
      references: {
        table: 'users',
        field: 'id'
      }
    });
  }
};
