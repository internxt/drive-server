import * as openpgp from 'openpgp';
import { expect } from 'chai';
import { describe, it } from 'mocha';
const { encrypt } = require('../../src/lib/AesUtil');

describe('# openpgp', () => {
  it('should have correct length', async () => {
    const randomKey = await openpgp.generateKey({
      userIDs: [{ email: 'inxt@inxt.com' }],
      curve: 'ed25519'
    });

    const privateKey = Buffer.from(randomKey.privateKey).toString('base64');
    const publicKey = Buffer.from(randomKey.publicKey).toString('base64');
    const revocationCertificate = Buffer.from(randomKey.revocationCertificate).toString('base64');

    const encryptedPrivateKey1 = encrypt(privateKey, '1234');
    const encryptedPrivateKey2 = encrypt(privateKey, '1234123412341234');

    expect(encryptedPrivateKey1.length).to.be.equals(encryptedPrivateKey2.length);
    expect(publicKey.length).to.be.lessThan(920);
    expect(revocationCertificate.length).to.be.lessThan(476);
  });

  it('should have consistent lengths', async () => {
    const randomKey1 = await openpgp.generateKey({
      userIDs: [{ email: 'inxt@inxt.com' }],
      curve: 'ed25519'
    });

    const randomKey2 = await openpgp.generateKey({
      userIDs: [{ email: 'inxt@inxt.com' }],
      curve: 'ed25519'
    });

    const randomKey3 = await openpgp.generateKey({
      userIDs: [{ email: 'inxt@inxt.com' }],
      curve: 'ed25519'
    });

    expect(randomKey1.publicKey.length).to.be.equals(randomKey2.publicKey.length);
    expect(randomKey2.publicKey.length).to.be.equals(randomKey3.publicKey.length);
  });
});
