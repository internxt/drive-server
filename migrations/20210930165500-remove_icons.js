module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('folders', 'icon_id');
    await queryInterface.removeColumn('folders', 'color');
    await queryInterface.dropTable('icons');
  },
  down: async (queryInterface, Sequelize) => {
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

    await queryInterface.bulkInsert('icons', [
      { id: 1, name: 'avatarcircleneutral' },
      { id: 2, name: 'backup' },
      { id: 3, name: 'barchart' },
      { id: 4, name: 'bell' },
      { id: 5, name: 'binoculars' },
      { id: 6, name: 'book' },
      { id: 7, name: 'bowl' },
      { id: 8, name: 'camera' },
      { id: 9, name: 'categories' },
      { id: 10, name: 'circlefilledcheckmark' },
      { id: 11, name: 'clappboard' },
      { id: 12, name: 'clipboard' },
      { id: 13, name: 'cloud' },
      { id: 14, name: 'controllerneogeo' },
      { id: 15, name: 'dollarsign' },
      { id: 16, name: 'facehappy' },
      { id: 17, name: 'file' },
      { id: 18, name: 'heartfilled' },
      { id: 19, name: 'inbox' },
      { id: 20, name: 'lighton' },
      { id: 21, name: 'locklocked' },
      { id: 22, name: 'musicnote' },
      { id: 23, name: 'navigationcircle' },
      { id: 24, name: 'notifications' },
      { id: 25, name: 'path' },
      { id: 26, name: 'running' },
      { id: 27, name: 'starfilled' },
      { id: 28, name: 'video' },
      { id: 29, name: 'window' },
      { id: 30, name: 'yinyang' }
    ]);
  }
};
