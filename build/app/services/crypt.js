"use strict";
var CryptoJS = require('crypto-js');
var crypto = require('crypto');
var AesUtil = require('../../lib/AesUtil');
module.exports = function (Model, App) {
    var log = App.logger;
    function probabilisticEncryption(content) {
        try {
            var b64 = CryptoJS.AES.encrypt(content, App.config.get('secrets').CRYPTO_SECRET).toString();
            var e64 = CryptoJS.enc.Base64.parse(b64);
            var eHex = e64.toString(CryptoJS.enc.Hex);
            return eHex;
        }
        catch (error) {
            log.error("(probabilisticEncryption): " + error);
            return null;
        }
    }
    function probabilisticDecryption(cipherText) {
        try {
            var reb64 = CryptoJS.enc.Hex.parse(cipherText);
            var bytes = reb64.toString(CryptoJS.enc.Base64);
            var decrypt = CryptoJS.AES.decrypt(bytes, App.config.get('secrets').CRYPTO_SECRET);
            var plain = decrypt.toString(CryptoJS.enc.Utf8);
            return plain;
        }
        catch (error) {
            log.error("(probabilisticDecryption): " + error);
            return null;
        }
    }
    function encryptTextWithKey(textToEncrypt, keyToEncrypt) {
        var bytes = CryptoJS.AES.encrypt(textToEncrypt, keyToEncrypt).toString();
        var text64 = CryptoJS.enc.Base64.parse(bytes);
        return text64.toString(CryptoJS.enc.Hex);
    }
    function deterministicEncryption(content, salt) {
        try {
            var key = CryptoJS.enc.Hex.parse(App.config.get('secrets').CRYPTO_SECRET);
            var iv = salt ? CryptoJS.enc.Hex.parse(salt.toString()) : key;
            var encrypt = CryptoJS.AES.encrypt(content, key, { iv: iv }).toString();
            var b64 = CryptoJS.enc.Base64.parse(encrypt);
            var eHex = b64.toString(CryptoJS.enc.Hex);
            return eHex;
        }
        catch (e) {
            return null;
        }
    }
    function deterministicDecryption(cipherText, salt) {
        try {
            var key = CryptoJS.enc.Hex.parse(App.config.get('secrets').CRYPTO_SECRET);
            var iv = salt ? CryptoJS.enc.Hex.parse(salt.toString()) : key;
            var reb64 = CryptoJS.enc.Hex.parse(cipherText);
            var bytes = reb64.toString(CryptoJS.enc.Base64);
            var decrypt = CryptoJS.AES.decrypt(bytes, key, { iv: iv });
            var plain = decrypt.toString(CryptoJS.enc.Utf8);
            return plain;
        }
        catch (e) {
            return null;
        }
    }
    function encryptName(name, salt) {
        if (salt !== undefined) {
            var encryptedResult = AesUtil.encrypt(name, salt, salt === undefined);
            return encryptedResult;
        }
        return probabilisticEncryption(name);
    }
    function decryptName(cipherText, salt) {
        if (salt) {
            try {
                var result = AesUtil.decrypt(cipherText, salt);
                return result;
            }
            catch (e) {
                // no op
            }
        }
        if (!salt) {
            // If no salt, something is trying to use legacy decryption
            return probabilisticDecryption(cipherText);
        }
        // If salt is provided, we could have 2 scenarios
        // 1. The cipherText is truly encripted with salt in a deterministic way
        var decrypted = deterministicDecryption(cipherText, salt);
        if (!decrypted) {
            // 2. The deterministic algorithm failed although salt were provided.
            // So, the cipherText is encrypted in a probabilistic way.
            return probabilisticDecryption(cipherText);
        }
        return decrypted;
    }
    // AES Plain text decryption method
    function decryptText(encryptedText, salt) {
        return decryptName(encryptedText, salt);
    }
    // AES Plain text encryption method
    function encryptText(textToEncrypt, salt) {
        return encryptName(textToEncrypt, salt);
    }
    // Method to hash password.
    // If salt is passed, use it, in other case use crypto lib for generate salt
    function passToHash(passObject) {
        try {
            var salt = passObject.salt
                ? CryptoJS.enc.Hex.parse(passObject.salt.toString())
                : CryptoJS.lib.WordArray.random(128 / 8);
            var hash = CryptoJS.PBKDF2(passObject.password, salt, {
                keySize: 256 / 32,
                iterations: 10000
            });
            var hashedObjetc = {
                salt: salt.toString(),
                hash: hash.toString()
            };
            return hashedObjetc;
        }
        catch (error) {
            throw Error(error);
        }
    }
    function hashSha256(text) {
        return crypto.createHash('sha256').update(text)
            .digest('hex');
    }
    var RandomPassword = function (email) {
        var randomSeed = crypto.pbkdf2Sync(email, process.env.CRYPTO_SECRET, 100000, 8, 'sha512');
        var randomPassword = crypto.createHash('sha512').update(randomSeed).digest().slice(0, 5)
            .toString('hex');
        return randomPassword;
    };
    return {
        Name: 'Crypt',
        decryptName: decryptName,
        encryptName: encryptName,
        decryptText: decryptText,
        encryptText: encryptText,
        deterministicEncryption: deterministicEncryption,
        deterministicDecryption: deterministicDecryption,
        probabilisticEncryption: probabilisticEncryption,
        probabilisticDecryption: probabilisticDecryption,
        passToHash: passToHash,
        hashSha256: hashSha256,
        encryptTextWithKey: encryptTextWithKey,
        RandomPassword: RandomPassword
    };
};
