import { aes } from '@internxt/lib';
const bip39 = require('bip39');
const server = require('../../src/app');

export function encryptFilename(filename: string, folderId: number): string {
  const aesInit = {
    iv: 'd139cb9a2cd17092e79e1861cf9d7023',
    // eslint-disable-next-line max-len
    salt: '38dce0391b49efba88dbc8c39ebf868f0267eb110bb0012ab27dc52a528d61b1d1ed9d76f400ff58e3240028442b1eab9bb84e111d9dadd997982dbde9dbd25e',
  };
  const CRYPTO_KEY = '8Q8VMUE3BJZV87GT';

  return aes.encrypt(filename, `${CRYPTO_KEY}-${folderId}`, aesInit);
}

export async function createTestUser(email: string): Promise<any> {
  const cryptService = server.services.Crypt;

  const randomPassword = cryptService.RandomPassword(email);
  const encryptedPassword = cryptService.passToHash({ password: randomPassword });

  const encryptedHash = cryptService.encryptText(encryptedPassword.hash);
  const encryptedSalt = cryptService.encryptText(encryptedPassword.salt);

  const newMnemonic = bip39.generateMnemonic(256);
  const encryptedMnemonic = cryptService.encryptTextWithKey(newMnemonic, randomPassword);

  const userCreated = await server.services.User.FindOrCreate({
    email: email,
    name: 'test',
    lastname: 'e2e',
    referrer: null,
    uuid: null,
    credit: 0,
    welcomePack: true,
    registerCompleted: false,
    username: email,
    sharedWorkspace: false,
    bridgeUser: email,
    password: encryptedHash,
    mnemonic: encryptedMnemonic,
    salt: encryptedSalt,
  });

  return await server.services.User.InitializeUser(userCreated);
}

export async function deleteTestUser(userId: number): Promise<void> {
  const user = await server.models.users.findOne({ where: { id: userId } });
  await user.destroy();
}

export async function delay(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}
