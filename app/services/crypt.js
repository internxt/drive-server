const Secret = require('crypto-js');

module.exports = (Model, App) => {
  const logger = App.logger;

  function encryptName(name, salt) {
    if (!salt) {
      // If no salt, somewhere is trying to use legacy encryption
      return probabilisticEncryption(name);
    } else {
      // If salt is provided, use new deterministic encryption
      return deterministicEncryption(name, salt);
    }
  }

  function decryptName(cipherText, salt) {
    if (!salt) {
      // If no salt, something is trying to use legacy decryption
      return probabilisticDecryption(cipherText);
    } else {
      // If salt is provided, we could have 2 scenarios

      // 1. The cipherText is truly encripted with salt in a deterministic way
      const decrypted = deterministicDecryption(cipherText, salt);

      if (!decrypted) {
        // 2. The deterministic algorithm failed although salt were provided.
        // So, the cipherText is encrypted in a probabilistic way.

        return probabilisticDecryption(cipherText);
      } else {
        return decrypted;
      }
    }
  }

  function probabilisticEncryption(content) {
    try {
      const b64 = Secret.AES.encrypt(content, App.config.get('secrets').CRYPTO_SECRET).toString();
      const e64 = Secret.enc.Base64.parse(b64);
      const eHex = e64.toString(Secret.enc.Hex);
      return eHex;
    } catch (error) {
      logger.error(`(probabilisticEncryption): ${error}`);
      return null;
    }
  }

  function probabilisticDecryption(cipherText) {
    try {
      const reb64 = Secret.enc.Hex.parse(cipherText);
      const bytes = reb64.toString(Secret.enc.Base64);
      const decrypt = Secret.AES.decrypt(bytes, process.env.CRYPTO_SECRET);
      const plain = decrypt.toString(Secret.enc.Utf8);
      return plain;
    } catch (error) {
      logger.error(`(probabilisticDecryption): ${error}`);
      return null;
    }
  }

  function deterministicEncryption(content, salt) {
    try {
      const key = Secret.enc.Hex.parse(App.config.get('secrets').CRYPTO_SECRET);
      const iv = salt ? Secret.enc.Hex.parse(salt.toString()) : key;

      const encrypt = Secret.AES.encrypt(content, key, { iv: iv }).toString();
      const b64 = Secret.enc.Base64.parse(encrypt);
      const eHex = b64.toString(Secret.enc.Hex);
      return eHex;
    } catch (e) {
      return null;
    }
  }

  function deterministicDecryption(cipherText, salt) {
    try {
      const key = Secret.enc.Hex.parse(App.config.get('secrets').CRYPTO_SECRET);
      const iv = salt ? Secret.enc.Hex.parse(salt.toString()) : key;

      const reb64 = Secret.enc.Hex.parse(cipherText);
      const bytes = reb64.toString(Secret.enc.Base64);
      const decrypt = Secret.AES.decrypt(bytes, key, { iv: iv });
      const plain = decrypt.toString(Secret.enc.Utf8);

      return plain;
    } catch (e) {
      return null;
    }
  }

  // AES Plain text decryption method
  function decryptText(encryptedText, salt) {
    return decryptName(encryptedText, salt);
  }

  // AES Plain text encryption method
  function encryptText(textToEncrypt, salt) {
    return encryptName(textToEncrypt, salt);
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
    deterministicEncryption,
    deterministicDecryption,
    probabilisticEncryption,
    probabilisticDecryption,
    passToHash
  }
}
