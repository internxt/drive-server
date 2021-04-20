module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('icons', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING
      }
    });

    await queryInterface.addColumn('folders', 'icon_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'icons',
        key: 'id'
      }
    });

    await queryInterface.addColumn('folders', 'color', {
      type: Sequelize.STRING
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('folders', 'icon_id');
    await queryInterface.removeColumn('folders', 'color');
    await queryInterface.dropTable('icons');
  }
};
