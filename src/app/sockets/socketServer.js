const io = require('socket.io');

module.exports = (App) => {
  io(App.instance, {
    path: '/api/sockets',
    cors: {
      origin: '*',
    },
  });
};
