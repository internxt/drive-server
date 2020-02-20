const expect = require('chai').expect;
const { describe, it } = require('mocha');
const cryptService = require('../../app/services/crypt');
const logger = require('../../lib/logger');

const Config = require('../../config/index');
const Server = require('../../config/initializers/server');

const App = new Server(new Config());

const crypt = cryptService(null, App);

describe('# Crypto tools', function () {
  describe('random encription', function () {
    it('should encrypt & decrypt', function () {
      const encryptName = crypt.probabilisticEncryption('name');
      const decryptName = crypt.probabilisticDecryption(encryptName);
      expect(decryptName).equals('name');
    });

    it('should encrypt with random salt', function () {
      const encryptName1 = crypt.encryptName('name');
      const encryptName2 = crypt.encryptName('name');

      const decryptName1 = crypt.decryptName(encryptName1);
      const decryptName2 = crypt.decryptName(encryptName2);

      expect(encryptName1).not.equals(encryptName2);
      expect(decryptName1).equals('name');
      expect(decryptName2).equals('name');
    });
  });

  describe('deterministic encryption', function () {
    it('should have a deterministic encryption without salt', function () {
      const encryptName1 = crypt.deterministicEncryption('name');
      const encryptName2 = crypt.deterministicEncryption('name');
      expect(encryptName1).equals(encryptName2);

      const decryptName1 = crypt.deterministicDecryption(encryptName1);
      const decryptName2 = crypt.deterministicDecryption(encryptName2);
      expect(decryptName1).equals('name');
      expect(decryptName2).equals('name');
    });

    it('should have a deterministic encryption with salt', function () {
      const encryptName1 = crypt.deterministicEncryption('name');
      const encryptName2 = crypt.deterministicEncryption('name', '123');
      const encryptName3 = crypt.deterministicEncryption('name', '123');
      expect(encryptName1).not.equals(encryptName2);
      expect(encryptName2).equals(encryptName3);

      const decryptName1 = crypt.deterministicDecryption(encryptName1);
      const decryptName2 = crypt.deterministicDecryption(encryptName2, '123');
      expect(decryptName1).equals('name');
      expect(decryptName2).equals('name');
    });

    it('should admit numeric salt', function () {
      const saltString = '123';
      const saltNumber = 123;

      const encryptNameString = crypt.deterministicEncryption('name', saltString);
      const encryptNameNumber = crypt.deterministicEncryption('name', saltNumber);

      expect(encryptNameString).equal(encryptNameNumber);
    });

    it('should admit UTF8 special chars', function () {
      const unicodeString = '\u0065\u0301\uD83D\uDE00';

      const encrypted = crypt.deterministicEncryption(unicodeString);
      const decrypted = crypt.deterministicDecryption(encrypted);

      expect(decrypted).equals(unicodeString);
    });
  });

  describe('transgenerational encryption/decryption', function () {
    it('should use deterministic decription if salt is provided', function () {
      const encryptName1 = crypt.encryptName('name');
      const encryptName2 = crypt.encryptName('name');
      const encryptName3 = crypt.encryptName('name', 123);
      const encryptName4 = crypt.encryptName('name', 123);

      expect(encryptName1).not.equals(encryptName2);
      expect(encryptName2).not.equals(encryptName3);
      expect(encryptName3).equals(encryptName4);
    });

    it('should use probabilistic decryption if deterministic decryption fails', function () {
      const probEncrypt = crypt.probabilisticEncryption('name');
      const deterDecrypt = crypt.decryptName(probEncrypt, '123');

      expect(deterDecrypt).equals('name');

      const probEncrypt2 = crypt.deterministicEncryption('name', '123');
      const deterDecrypt2 = crypt.decryptName(probEncrypt2, '123');

      expect(deterDecrypt2).equals('name');
    });
  });

  describe('lab', function () {
    it('should encryptName & encryptText be the same', function () {
      const encryptName = crypt.probabilisticEncryption('name');
      const encryptText = crypt.encryptText('name');

      const decryptName = crypt.decryptName(encryptName);
      const decryptText = crypt.decryptText(encryptText);

      expect(decryptName).equals(decryptText);
    });
  });
});
