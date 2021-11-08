"use strict";
var bip39 = require('bip39');
module.exports = function (Router, Service, App) {
    Router.get('/bits', function (req, res) {
        var newBits = bip39.generateMnemonic(256);
        var eNewBits = App.services.Crypt.encryptText(newBits);
        res.status(200).send({ bits: eNewBits });
    });
};
