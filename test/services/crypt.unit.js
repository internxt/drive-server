const expect = require('chai').expect;
const cryptService = require('../../app/services/crypt');
const logger = require('../../lib/logger');

const Config = require('../../config/index');
const Server = require('../../config/initializers/server');

const App = new Server(new Config());

const crypt = cryptService(null, App);

describe('# Crypto tools', function() {
    it ('should encrypt & decrypt', function() {
        const encryptName = crypt.encryptName('name');
        const decryptName = crypt.decryptName(encryptName);
        expect(decryptName).equals('name');
    });

    it ('should have a deterministic encryption without salt', function() {
        const encryptName1 = crypt.deterministicEncryption('name');
        const encryptName2 = crypt.deterministicEncryption('name');
        expect(encryptName1).equals(encryptName2);

        const decryptName1 = crypt.deterministicDecryption(encryptName1);
        const decryptName2 = crypt.deterministicDecryption(encryptName2);
        expect(decryptName1).equals('name');
        expect(decryptName2).equals('name');
    });

    it ('should have a deterministic encryption with salt', function() {
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

    it('should admit numeric salt', function() {
        const saltString = '123';
        const saltNumber = 123;

        const encryptNameString = crypt.deterministicEncryption('name', saltString);
        const encryptNameNumber = crypt.deterministicEncryption('name', saltNumber);

        expect(encryptNameString).equal(encryptNameNumber);
    });

    it ('should admit UTF8 special chars', function() {
        const unicode_string = '\u0065\u0301\uD83D\uDE00';

        const encrypted = crypt.deterministicEncryption(unicode_string);
        const decrypted = crypt.deterministicDecryption(encrypted);

        expect(decrypted).equals(unicode_string);
    });
});