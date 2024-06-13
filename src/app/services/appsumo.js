const crypto = require('crypto');
const bip39 = require('bip39');
const { default: axios } = require('axios');
const bytes = require('bytes');
const { merge } = require('lodash');

const UserService = require('./user');
const CryptService = require('./crypt');

const AppSumoTiers = [
  { name: 'internxt_tier1', size: '500GB' },
  { name: 'internxt_tier2', size: '1TB' },
  { name: 'internxt_tier3', size: '2TB' },
  { name: 'internxt_tier4', size: '3TB' },
  { name: 'internxt_tier5', size: '5TB' },
  { name: 'lifetime_2TB', size: '2TB' },
  { name: 'lifetime_10TB', size: '10TB' },
  { name: 'sharewareonsale', size: '20GB' },
  { name: 'giveawayoftheday', size: '20GB' },
  { name: 'lifetime_infinite', size: '99TB' },
];

function GetLicenseByName(name) {
  return AppSumoTiers.find((license) => license.name === name);
}

module.exports = (Model, App) => {
  const UserServiceInstance = UserService(Model, App);
  const CryptServiceInstance = CryptService(Model, App);

  const ApplyLicense = async (user, plan) => {
    const { GATEWAY_USER, GATEWAY_PASS } = process.env;

    const license = GetLicenseByName(plan);
    const size = bytes.parse(license ? license.size : '10GB');

    return axios.post(
      `${process.env.STORJ_BRIDGE}/gateway/upgrade`,
      {
        email: user.email,
        bytes: size,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        auth: { username: GATEWAY_USER, password: GATEWAY_PASS },
      },
    );
  };

  const RandomPassword = (email) => {
    const randomSeed = crypto.pbkdf2Sync(email, process.env.CRYPTO_SECRET, 100000, 8, 'sha512');
    const randomPassword = crypto.createHash('sha512').update(randomSeed).digest().slice(0, 5).toString('hex');

    return randomPassword;
  };

  const updateOrCreate = async (model, where, values) => {
    const exists = await model.findOne(where);
    if (exists) {
      return model.update(values, where);
    }
    const finalValues = merge(values, where.where);
    return model.create(finalValues);
  };

  // EXAMPLE: updateOrCreate(Model.AppSumo, { where: { userId: 244 } }, { uuid: 'lol3', planId: 'plan3', invoiceItemUuid: 'invoice3' });

  const RegisterIncomplete = async (email, plan, uuid, invoice) => {
    App.logger.warn('Register activation from APPSUMO for %s', email);
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
      credit: 0,
      welcomePack: true,
      registerCompleted: false,
      username: email,
      sharedWorkspace: true,
      bridgeUser: email,
    };

    const user = await UserServiceInstance.FindOrCreate(userObject);

    const appSumoLicense = {
      planId: plan,
      uuid,
      invoiceItemUuid: invoice,
    };

    await updateOrCreate(Model.AppSumo, { where: { userId: user.id } }, appSumoLicense);
    return ApplyLicense(user, plan);
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
    // user.sharedWorkspace = true;
    return user.save();
  };

  const UpdateLicense = async (email, newDetails) => {
    const user = await Model.users.findOne({ where: { username: email } });
    if (user) {
      return updateOrCreate(Model.AppSumo, { where: { userId: user.id } }, newDetails);
    }
    return null;
  };

  const GetDetails = async (userId) => {
    return Model.AppSumo.findOne({ where: { userId } }).then(async (license) => {
      if (!license) {
        throw Error('No AppSumo license');
      }

      const unlimited = await Model.plan.findOne({ where: { userId, name: 'appsumo_unlimited_members' } });

      if (unlimited) {
        license.planId = 'unlimited';
      }

      return license;
    });
  };

  return {
    Name: 'AppSumo',
    RegisterIncomplete,
    CompleteInfo,
    GetDetails,
    UpdateLicense,
    ApplyLicense,
  };
};
