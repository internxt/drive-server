const bip39 = require('bip39');

module.exports = (Router, Service, App) => {
  Router.get('/bits', (req, res) => {
    const newBits = bip39.generateMnemonic(256);
    const eNewBits = App.services.Crypt.encryptText(newBits);
    res.status(200).send({ bits: eNewBits });
  });
};
