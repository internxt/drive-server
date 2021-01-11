module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('users', 'password', {
        type: Sequelize.BLOB('medium'),
        get() {
          return this.getDataValue('password').toString('utf8');
        }
      }),
      queryInterface.changeColumn('users', 'mnemonic', {
        type: Sequelize.BLOB('medium'),
        get() {
          return this.getDataValue('mnemonic').toString('utf8');
        }
      }),
      queryInterface.changeColumn('users', 'hKey', {
        type: Sequelize.BLOB('medium'),
        get() {
          return this.getDataValue('hKey').toString('utf8');
        }
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('users', 'password', {
        type: Sequelize.STRING
      }),
      queryInterface.changeColumn('users', 'mnemonic', {
        type: Sequelize.STRING
      }),
      queryInterface.changeColumn('users', 'hKey', { type: Sequelize.STRING })
    ]);
  }
};
