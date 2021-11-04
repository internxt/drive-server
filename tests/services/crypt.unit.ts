require('dotenv').config();

import { expect } from 'chai';
import { describe, it } from 'mocha';
import Server from '../../src/config/initializers/server';

const cryptService = require('../../src/app/services/crypt');

const App = new Server();

const crypt = cryptService(null, App);
const AesUtil = require('../../src/lib/AesUtil');

describe('# Crypto tools', () => {
  describe('random encription', () => {
    it('should encrypt & decrypt', () => {
      const encryptName = crypt.probabilisticEncryption('name');
      const decryptName = crypt.probabilisticDecryption(encryptName);
      expect(decryptName).equals('name');
    });

    it('should encrypt with random salt', () => {
      const encryptName1 = crypt.encryptName('name');
      const encryptName2 = crypt.encryptName('name');

      const decryptName1 = crypt.decryptName(encryptName1);
      const decryptName2 = crypt.decryptName(encryptName2);

      expect(encryptName1).not.equals(encryptName2);
      expect(decryptName1).equals('name');
      expect(decryptName2).equals('name');
    });
  });

  describe('deterministic encryption', () => {
    it('should have a deterministic encryption without salt', () => {
      const encryptName1 = crypt.deterministicEncryption('name');
      const encryptName2 = crypt.deterministicEncryption('name');
      expect(encryptName1).equals(encryptName2);

      const decryptName1 = crypt.deterministicDecryption(encryptName1);
      const decryptName2 = crypt.deterministicDecryption(encryptName2);
      expect(decryptName1).equals('name');
      expect(decryptName2).equals('name');
    });

    it('should have a deterministic encryption with salt', () => {
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

    it('should admit numeric salt', () => {
      const saltString = '123';
      const saltNumber = 123;

      const encryptNameString = crypt.deterministicEncryption('name',
        saltString);
      const encryptNameNumber = crypt.deterministicEncryption('name', saltNumber);

      expect(encryptNameString).equal(encryptNameNumber);
    });

    it('should admit UTF8 special chars', () => {
      const unicodeString = '\u0065\u0301\uD83D\uDE00';

      const encrypted = crypt.deterministicEncryption(unicodeString);
      const decrypted = crypt.deterministicDecryption(encrypted);

      expect(decrypted).equals(unicodeString);
    });
  });

  describe('transgenerational encryption/decryption', () => {
    it('should use deterministic decription if salt is provided', () => {
      const encryptName1 = crypt.encryptName('name');
      const encryptName2 = crypt.encryptName('name');
      const encryptName3 = crypt.encryptName('name', 123);
      const encryptName4 = crypt.encryptName('name', 123);

      expect(encryptName1).not.equals(encryptName2);
      expect(encryptName2).not.equals(encryptName3);
      expect(encryptName3).equals(encryptName4);
    });

    it('should use probabilistic decryption if deterministic decryption fails', () => {
      const probEncrypt = crypt.probabilisticEncryption('name');
      const deterDecrypt = crypt.decryptName(probEncrypt, '123');

      expect(deterDecrypt).equals('name');

      const probEncrypt2 = crypt.deterministicEncryption('name', '123');
      const deterDecrypt2 = crypt.decryptName(probEncrypt2, '123');

      expect(deterDecrypt2).equals('name');
    });
  });

  describe('lab', () => {
    it('should encryptName & encryptText be the same', () => {
      const encryptName = crypt.probabilisticEncryption('name');
      const encryptText = crypt.encryptText('name');

      const decryptName = crypt.decryptName(encryptName);
      const decryptText = crypt.decryptText(encryptText);

      expect(decryptName).equals(decryptText);
    });
  });

  describe('# AES new encryption', () => {
    it('should be deterministic', () => {
      const encrypt1 = AesUtil.encrypt('TEST', 0);
      const encrypt2 = AesUtil.encrypt('TEST', 0);
      expect(encrypt1).to.be.equals(encrypt2);
    });

    it('should be able to generate random iv', () => {
      const encrypt1 = AesUtil.encrypt('TEST', 0, true);
      const encrypt2 = AesUtil.encrypt('TEST', 0, true);

      const decrypt1 = AesUtil.decrypt(encrypt1, 0);
      const decrypt2 = AesUtil.decrypt(encrypt2, 0);

      expect(encrypt1).to.be.not.equals(encrypt2);
      expect(decrypt1).to.be.equals(decrypt2);
    });

    it('should use AES as default encryption algorithm', () => {
      const encrypt1 = AesUtil.encrypt('TEST', 0);
      const encrypt2 = crypt.encryptName('TEST', 0);
      expect(encrypt1).to.be.equals(encrypt2);
    });
  });
});
