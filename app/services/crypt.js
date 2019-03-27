const Secret = require('crypto-js');

module.exports = (Model, App) => {
  const logger = App.logger;

  function decryptName(cipherText) {
    try {
      const reb64 = Secret.enc.Hex.parse(cipherText);
      const bytes = reb64.toString(Secret.enc.Base64);
      const decrypt = Secret.AES.decrypt(bytes, process.env.CRYPTO_SECRET);
      const plain = decrypt.toString(Secret.enc.Utf8);
      return plain;
    } catch (error) {
      logger.error(error);
      return null;
    }
  }

  const encryptName = (name) => {
    try {
      const b64 = Secret.AES.encrypt(name, process.env.CRYPTO_SECRET);
      const e64 = Secret.enc.Base64.parse(b64);
      const eHex = e64.toString(Secret.enc.Hex);
      return eHex;
    } catch (error) {
      logger.error(`(wncryptName): ${error}`);
      return null;
    }
}

  // AES Plain text decryption method
  function decryptText(encryptedText) {
    try {
      const reb = Secret.enc.Hex.parse(encryptedText);
      const bytes = Secret.AES.decrypt(reb.toString(Secret.enc.Base64), process.env.CRYPTO_SECRET);
      return bytes.toString(Secret.enc.Utf8);
    } catch (error) {
      throw new Error(error);
    }
  }

  // AES Plain text encryption method
  function encryptText(textToEncrypt) {
    try {
      const bytes = Secret.AES.encrypt(textToEncrypt, process.env.CRYPTO_SECRET).toString();
      const text64 = Secret.enc.Base64.parse(bytes);
      return text64.toString(Secret.enc.Hex);
    } catch (error) {
      throw new Error(error);
    }
  }

  // Method to hash password. If salt is passed, use it, in other case use crypto lib for generate salt
  function passToHash(passObject) {
    try {
      const salt = passObject.salt ? Secret.enc.Hex.parse(passObject.salt.toString()) : Secret.lib.WordArray.random(128 / 8);
      const hash = Secret.PBKDF2(passObject.password, salt, { keySize: 256 / 32, iterations: 10000 });
      const hashedObjetc = {
        salt: salt.toString(),
        hash: hash.toString()
      }
      return hashedObjetc;
    } catch (error) {
      throw new Error(error);
    }
  }

  return {
    Name: 'Crypt',
    decryptName,
    encryptName,
    decryptText,
    encryptText,
    passToHash
  }
}
