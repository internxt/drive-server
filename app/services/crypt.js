const Secret = require('crypto-js');

module.exports = (Model, App) => {
  const logger = App.logger;

  function decryptName(cipherText) {
    try {
      const reb64 = Secret.enc.Hex.parse(cipherText);
      const bytes = reb64.toString(Secret.enc.Base64);
      const decrypt = Secret.AES.decrypt(bytes, App.config.get('secrets').CRYPTO_SECRET);
      const plain = decrypt.toString();
      return plain;
    } catch (error) {
      logger.error(error);
      return null;
    }
  }

  const encryptName = (name) => {
    try {
      const b64 = Secret.AES.encrypt(name, App.config.get('secrets').CRYPTO_SECRET).toString();
      const e64 = Secret.enc.Base64.parse(b64);
      const eHex = e64.toString(Secret.enc.Hex);
      return eHex;
    } catch (error) {
      logger.error(error);
      return null;
    }
  }

  return {
    Name: 'Crypt',
    decryptName,
    encryptName
  }
}
