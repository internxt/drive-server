module.exports = {
  up: (queryInterface) => {
    return queryInterface.addIndex('devices', {
      fields: ['mac', 'userId'],
      name: 'mac_device_index'
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeIndex('devices', 'mac_device_index');
  }
};
