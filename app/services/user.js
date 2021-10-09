const axios = require('axios');
const sequelize = require('sequelize');
const async = require('async');
const { col, fn } = require('sequelize');
const crypto = require('crypto-js');
const AnalyticsService = require('./analytics');
const KeyServerService = require('./keyserver');
const passport = require('../middleware/passport');
const { SYNC_KEEPALIVE_INTERVAL_MS } = require('../constants');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const Logger = App.logger;
  const KeyServer = KeyServerService(Model, App);
  const analytics = AnalyticsService(Model, App);

  const FindOrCreate = (user) => {
    // Create password hashed pass only when a pass is given
    const userPass = user.password ? App.services.Crypt.decryptText(user.password) : null;
    const userSalt = user.salt ? App.services.Crypt.decryptText(user.salt) : null;

    // Throw error when user email. pass, salt or mnemonic is missing
    if (!user.email || !userPass || !userSalt || !user.mnemonic) {
      throw Error('Wrong user registration data');
    }

    return Model.users.sequelize.transaction(async (t) => Model.users.findOrCreate({
      where: { username: user.email },
      defaults: {
        email: user.email,
        name: user.name,
        lastname: user.lastname,
        password: userPass,
        mnemonic: user.mnemonic,
        hKey: userSalt,
        referral: user.referral,
        uuid: null,
        credit: user.credit,
        welcomePack: true,
        registerCompleted: user.registerCompleted,
        username: user.username,
        bridgeUser: user.bridgeUser
      },
      transaction: t
    }).then(async ([userResult, isNewRecord]) => {
      if (isNewRecord) {
        if (user.publicKey && user.privateKey && user.revocationKey) {
          Model.keyserver.findOrCreate({
            where: { user_id: userResult.id },
            defaults: {
              user_id: user.id,
              private_key: user.privateKey,
              public_key: user.publicKey,
              revocation_key: user.revocationKey,
              encrypt_version: null
            },
            transaction: t
          });
        }

        // Create bridge pass using email (because id is unconsistent)
        const bcryptId = await App.services.Inxt.IdToBcrypt(userResult.email);

        const bridgeUser = await App.services.Inxt.RegisterBridgeUser(userResult.email, bcryptId);
        if (bridgeUser && bridgeUser.response && (bridgeUser.response.status === 500 || bridgeUser.response.status === 400)) {
          throw Error(bridgeUser.response.data.error);
        }

        if (!bridgeUser.data) {
          throw Error('Error creating bridge user');
        }

        Logger.info('User Service | created brigde user: %s', userResult.email);

        // Store bcryptid on user register
        await userResult.update({
          userId: bcryptId,
          uuid: bridgeUser.data.uuid
        }, { transaction: t });

        // Set created flag for Frontend management
        Object.assign(userResult, { isNewRecord });
      }

      // TODO: proveriti userId kao pass
      return userResult;
    }).catch((err) => {
      if (err.response) {
        // This happens when email is registered in bridge
        Logger.error(err.response.data);
      } else {
        Logger.error(err.stack);
      }

      throw Error(err);
    })); // end transaction
  };

  const InitializeUser = (user) => Model.users.sequelize.transaction((t) => Model.users
    .findOne({ where: { username: { [Op.eq]: user.email } } }).then(async (userData) => {
      if (userData.root_folder_id) {
        userData.mnemonic = user.mnemonic;

        return userData;
      }

      const { Inxt, Crypt } = App.services;
      const rootBucket = await Inxt.CreateBucket(userData.email, userData.userId, user.mnemonic);
      Logger.info('User init | root bucket created %s', rootBucket.name);

      const rootFolderName = await Crypt.encryptName(`${rootBucket.name}`);
      const rootFolder = await userData.createFolder({
        name: rootFolderName,
        bucket: rootBucket.id
      });

      Logger.info('User init | root folder created, id: %s', rootFolder.id);

      // Update user register with root folder Id
      await userData.update({ root_folder_id: rootFolder.id }, { transaction: t });

      // Set decrypted mnemonic to returning object
      const updatedUser = userData;
      updatedUser.mnemonic = user.mnemonic;
      updatedUser.bucket = rootBucket.id;

      return updatedUser;
    }));

  const FindUserByEmail = (email) => new Promise((resolve, reject) => {
    Model.users
      .findOne({ where: { username: { [Op.eq]: email } } }).then((userData) => {
        if (userData) {
          const user = userData.dataValues;
          if (user.mnemonic) user.mnemonic = user.mnemonic.toString();

          resolve(user);
        } else {
          Logger.error('User %s not found on Drive database', email);
          reject(Error('Wrong email/password'));
        }
      }).catch((err) => reject(err));
  });

  const FindUserByUuid = (userUuid) => Model.users.findOne({ where: { uuid: { [Op.eq]: userUuid } } });

  const FindUserObjByEmail = (email) => Model.users.findOne({ where: { username: { [Op.eq]: email } } });

  const DeactivateUser = (email) => new Promise((resolve, reject) => Model.users
    .findOne({ where: { username: { [Op.eq]: email } } }).then((user) => {
      const password = crypto.SHA256(user.userId).toString();
      const auth = Buffer.from(`${user.email}:${password}`).toString('base64');

      axios
        .delete(`${App.config.get('STORJ_BRIDGE')}/users/${email}`, {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }).then((data) => {
          resolve(data);
        }).catch((err) => {
          Logger.warn(err.response.data);
          reject(err);
        });
    }).catch(reject));

  const ConfirmDeactivateUser = (token) => {
    let userEmail = null;
    return async.waterfall([
      (next) => {
        axios
          .get(`${App.config.get('STORJ_BRIDGE')}/deactivationStripe/${token}`, {
            headers: { 'Content-Type': 'application/json' }
          }).then((res) => {
            Logger.warn('User deleted from bridge');
            next(null, res);
          }).catch((err) => {
            Logger.error('Error user deleted from bridge: %s', err.message);
            next(err.response.data.error || err.message);
          });
      },
      (data, next) => {
        userEmail = data.data.email;
        Model.users.findOne({ where: { username: { [Op.eq]: userEmail } } }).then(async (user) => {
          if (!user) {
            return;
          }

          try {
            // DELETE FOREIGN KEYS
            user.root_folder_id = null;
            await user.save();
            const keys = await user.getKeyserver();
            if (keys) { await keys.destroy(); }

            const appSumo = await user.getAppSumo();
            if (appSumo) { await appSumo.destroy(); }
            const usersPhoto = await user.getUsersphoto();

            const photos = await usersPhoto.getPhotos();
            const photoIds = photos.map((x) => x.id);

            if (photoIds.length > 0) {
              await Model.previews.destroy({ where: { photoId: { [Op.in]: photoIds } } });
              await Model.photos.destroy({ where: { id: { [Op.in]: photoIds } } });
            }

            if (usersPhoto) { await usersPhoto.destroy(); }

            await user.destroy();
          } catch (e) {
            user.email += '-DELETED';
            user.username = user.email;
            user.save();
          }

          analytics.track({
            userId: user.uuid,
            event: 'user-deactivation-confirm',
            properties: { email: userEmail }
          });

          Logger.info('User deleted on sql: %s', userEmail);

          next();
        }).catch(next);
      }
    ]);
  };

  const Store2FA = (user, key) => Model.users.update({ secret_2FA: key }, { where: { username: { [Op.eq]: user } } });

  const Delete2FA = (user) => Model.users.update({ secret_2FA: null }, { where: { username: { [Op.eq]: user } } });

  const updatePrivateKey = (user, privateKey) => {
    return Model.keyserver.update({
      private_key: privateKey
    }, {
      where: { user_id: { [Op.eq]: user.id } }
    });
  };

  const UpdatePasswordMnemonic = async (user, currentPassword, newPassword, newSalt, mnemonic, privateKey) => {
    const storedPassword = user.password.toString();
    if (storedPassword !== currentPassword) {
      throw Error('Invalid password');
    }

    await Model.users.update({
      password: newPassword,
      mnemonic,
      hKey: newSalt
    }, {
      where: { username: { [Op.eq]: user.email } }
    });

    await updatePrivateKey(user, privateKey);
  };

  const recoverPassword = async (user, newPassword, newSalt, oldMnemonic, oldPrivateKey) => {
    // Update password, salt & mnemonic
    user.hKey = newSalt;
    user.mnemonic = oldMnemonic;
    user.password = newPassword;
    await user.save();

    const keys = await user.getKeyserver();
    if (!oldPrivateKey) {
      keys.destroy();
    } else {
      keys.private_key = oldPrivateKey;
      await keys.save().catch(() => { });
    }
  };

  const LoginFailed = (user, loginFailed) => Model.users.update({
    errorLoginCount: loginFailed ? sequelize.literal('error_login_count + 1') : 0
  }, { where: { username: user } });

  const ResendActivationEmail = (user) => axios.post(`${process.env.STORJ_BRIDGE}/activations`, { email: user });

  const UpdateAccountActivity = (user) => Model.users.update({ updated_at: new Date() }, { where: { username: user } });

  const getSyncDate = () => {
    let syncDate = Date.now();
    syncDate += SYNC_KEEPALIVE_INTERVAL_MS;
    return new Date(syncDate);
  };

  const hasUserSyncEnded = (sync) => {
    if (!sync) {
      return true;
    }

    const now = Date.now();
    const syncTime = sync.getTime();

    return now - syncTime > SYNC_KEEPALIVE_INTERVAL_MS;
  };

  const GetUserBucket = (userObject) => Model.folder.findOne({
    where: { id: { [Op.eq]: userObject.root_folder_id } },
    attributes: ['bucket']
  }).then((folder) => folder.bucket).catch(() => null);

  const UpdateUserSync = async (user, toNull) => {
    let sync = null;
    if (!toNull) {
      sync = getSyncDate();
    }

    try {
      await Model.users.update({ syncDate: sync }, { where: { username: user.email } });
    } catch (err) {
      Logger.error(err);
      throw Error('Internal server error');
    }

    return sync;
  };

  const GetOrSetUserSync = async (user) => {
    const currentSync = user.syncDate;
    const userSyncEnded = hasUserSyncEnded(currentSync);
    if (!currentSync || userSyncEnded) {
      await UpdateUserSync(user, false);
    }

    return !userSyncEnded;
  };

  const UnlockSync = (user) => {
    user.syncDate = null;
    return user.save();
  };

  const RegisterUser = async (newUser) => {
    const {
      email, password
    } = newUser;

    // Data validation for process only request with all data
    if (!(email && password)) {
      throw Error('You must provide registration data');
    }

    newUser.email = newUser.email.toLowerCase().trim();
    newUser.username = newUser.email;
    newUser.bridgeUser = newUser.email;
    newUser.credit = 0;
    newUser.referral = newUser.referrer;

    Logger.warn('Register request for %s', email);

    const hasReferral = false;
    const referrer = null;

    // Call user service to find or create user
    const userData = await FindOrCreate(newUser);

    if (!userData) {
      throw Error('User can not be created');
    }

    if (!userData.isNewRecord) {
      throw Error('This account already exists');
    }

    if (hasReferral) {
      analytics.identify({
        userId: userData.uuid,
        traits: { referred_by: referrer.uuid }
      });
    }

    // Successfull register
    const token = passport.Sign(userData.email, App.config.get('secrets').JWT);

    const user = {
      userId: userData.userId,
      mnemonic: userData.mnemonic,
      root_folder_id: userData.root_folder_id,
      name: userData.name,
      lastname: userData.lastname,
      uuid: userData.uuid,
      credit: userData.credit,
      createdAt: userData.createdAt,
      registerCompleted: userData.registerCompleted,
      email: userData.email,
      username: userData.username,
      bridgeUser: userData.bridgeUser
    };

    try {
      const keys = await KeyServer.getKeys(userData);
      user.privateKey = keys.private_key;
      user.publicKey = keys.public_key;
      user.revocationKey = keys.revocation_key;
    } catch (e) {
      // no op
    }

    return { token, user, uuid: userData.uuid };
  };

  const updateKeys = async (user, data) => {
    if (!data.privateKey) {
      throw new Error('No Private key provided');
    }

    if (!data.publicKey) {
      throw new Error('No Public key provided');
    }

    if (!data.revocationKey) {
      throw new Error('No Revocation key provided');
    }

    const userKeys = await user.getKeyserver();

    userKeys.private_key = data.privateKey;
    userKeys.public_key = data.publicKey;
    userKeys.revocation_key = data.revocationKey;

    return userKeys.save();
  };

  const getUsage = async (user) => {
    const targetUser = await Model.users.findOne({ where: { username: user.bridgeUser } });
    const usage = await Model.folder.findAll({
      where: { user_id: targetUser.id },
      include: [{ model: Model.file, attributes: [] }],
      attributes: [[fn('sum', col('size')), 'total']],
      raw: true
    });

    const driveUsage = usage[0].total;

    const photosUsage = await (async () => {
      const photosUser = await Model.usersphotos.findOne({ where: { userId: targetUser.id } });
      const photosList = await photosUser.getPhotos();
      const photosSizeList = photosList.map((p) => p.size);
      return photosSizeList.reduce((a, b) => a + b);
    })().catch(() => 0);

    const backupsQuery = await Model.backup.findAll({
      where: { userId: targetUser.id },
      attributes: [[fn('sum', col('size')), 'total']],
      raw: true
    });

    const backupsUsage = backupsQuery[0].total ? backupsQuery[0].total : 0;

    return {
      total: driveUsage + photosUsage + backupsUsage, _id: user.email, photos: photosUsage, drive: driveUsage || 0, backups: backupsUsage
    };
  };

  return {
    Name: 'User',
    FindOrCreate,
    RegisterUser,
    FindUserByEmail,
    FindUserObjByEmail,
    FindUserByUuid,
    InitializeUser,
    DeactivateUser,
    ConfirmDeactivateUser,
    Store2FA,
    Delete2FA,
    UpdatePasswordMnemonic,
    LoginFailed,
    ResendActivationEmail,
    UpdateAccountActivity,
    GetOrSetUserSync,
    UpdateUserSync,
    UnlockSync,
    GetUserBucket,
    getUsage,
    updateKeys,
    recoverPassword
  };
};
