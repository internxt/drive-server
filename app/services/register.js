const bip39 = require('bip39');
const CryptService = require('./crypt');
const UserService = require('./user');

module.exports = (Model, App) => {
  const CryptServiceInstance = CryptService(Model, App);
  const UserserviceInstance = UserService(Model, App);

  const StaggingRegister = async (email) => {
    const randomPassword = CryptServiceInstance.RandomPassword(email);
    const encryptedPassword = CryptServiceInstance.passToHash({ password: randomPassword });

    const encryptedHash = CryptServiceInstance.encryptText(encryptedPassword.hash);
    const encryptedSalt = CryptServiceInstance.encryptText(encryptedPassword.salt);

    const newMnemonic = bip39.generateMnemonic(256);
    const encryptedMnemonic = CryptServiceInstance.encryptTextWithKey(newMnemonic, randomPassword);

    const userObject = {
      email,
      name: null,
      lastname: null,
      password: encryptedHash,
      mnemonic: encryptedMnemonic,
      salt: encryptedSalt,
      referral: null,
      uuid: null,
      credit: 0,
      welcomePack: true,
      registerCompleted: false,
      username: email,
      bridgeUser: email
    };

    const user = await UserserviceInstance.FindOrCreate(userObject);
    return user;
  };

  return {
    Name: 'Register',
    StaggingRegister
  };
};
