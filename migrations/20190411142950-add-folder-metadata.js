module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.createTable('icons', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
          autoIncrement: true
        },
        name: {
          type: Sequelize.STRING
        }
      }),
      queryInterface.addColumn('folders', 'icon_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'icons',
          key: 'id'
        }
      }),
      queryInterface.addColumn('folders', 'color', {
        type: Sequelize.STRING
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('folders', 'icon_id').then(() => {
      return queryInterface.removeColumn('folders', 'color').then(res => {
        return queryInterface.dropTable('icons');
      });
    });
  }
};
