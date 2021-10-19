module.exports = {
  up: async (queryInterface) => {
    // Default constraint name is different in each
    const foreignKeys = await queryInterface.getForeignKeyReferencesForTable('keyserver');
    const userIdForeignKey = foreignKeys.find((constraint) => constraint.columnName === 'user_id');

    await queryInterface.removeConstraint('keyserver', userIdForeignKey.constraintName);
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
