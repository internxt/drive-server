'use strict'

module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.addColumn('files', 'createdAt', { type: Sequelize.DATE }),
            queryInterface.addColumn('files', 'updatedAt', { type: Sequelize.DATE })
        ]);
    },

    down: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.removeColumn('files', 'createdAt'),
            queryInterface.removeColumn('files', 'updatedAt')
        ]);
    }
}
