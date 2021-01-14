const crypto = require('crypto');
const bip39 = require('bip39');

const UserService = require('./user');
const CryptService = require('./crypt');

module.exports = (Model, App) => {
  const UserServiceInstance = UserService(Model, App);
  const CryptServiceInstance = CryptService(Model, App);

  const UserExists = async (email) => {
    const user = await Model.users.findOne({ where: { email }, attributes: ['id'] });
    return !!user;
  };

  const ApplyLicense = async () => {
    return 'PATATA';
  };

  const RandomPassword = (email) => {
    const randomSeed = crypto.pbkdf2Sync(email, process.env.CRYPTO_SECRET, 100000, 8, 'sha512');
    const randomPassword = crypto.createHash('sha512')
      .update(randomSeed)
      .digest()
      .slice(0, 5)
      .toString('hex');
    return randomPassword;
  };

  const RegisterIncomplete = async (email) => {
    const randomPassword = RandomPassword(email);
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
      referral: 'APPSUMO',
      uuid: null,
      referred: null,
      credit: 0,
      welcomePack: true,
      registerCompleted: false
    };

    return UserServiceInstance.FindOrCreate(userObject).then(ApplyLicense);
  };

  const CompleteInfo = async (user, info) => {
    if (user.registerCompleted) {
      throw Error('User info is up to date');
    }
    const cPassword = RandomPassword(user.email);
    const cSalt = user.hKey.toString();
    const hashedCurrentPassword = CryptServiceInstance.passToHash({ password: cPassword, salt: cSalt }).hash;

    const newPassword = CryptServiceInstance.decryptText(info.password);
    const newSalt = CryptServiceInstance.decryptText(info.salt);

    user.name = info.name;
    user.lastname = info.lastname;
    // user.registerCompleted = true;
    await user.save();
    await UserServiceInstance.UpdatePasswordMnemonic(user, hashedCurrentPassword, newPassword, newSalt, info.mnemonic);

    // Finish
    user.registerCompleted = true;
    return user.save();
  };

  return {
    Name: 'AppSumo',
    UserExists,
    RegisterIncomplete,
    CompleteInfo
  };
};
