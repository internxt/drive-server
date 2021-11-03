"use strict";
var io = require('socket.io');
module.exports = function (App) {
    io(App.instance, {
        path: '/api/sockets',
        cors: {
            origin: '*'
        }
    });
};
