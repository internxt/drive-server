const axios = require('axios');
const sequelize = require('sequelize');
const async = require('async');
const uuid = require('uuid');
const { Sequelize } = require('sequelize');
const crypto = require('crypto-js');
const Analytics = require('./analytics');

const { Op } = sequelize;

const SYNC_KEEPALIVE_INTERVAL_MS = 60 * 1000; // 60 seconds

module.exports = (Model, App) => {
  const Logger = App.logger;
  const analytics = Analytics(Model, App);

  const FindOrCreate = (user) => {
    // Create password hashed pass only when a pass is given
    const userPass = user.password ? App.services.Crypt.decryptText(user.password) : null;
    const userSalt = user.salt ? App.services.Crypt.decryptText(user.salt) : null;

    // Throw error when user email. pass, salt or mnemonic is missing
    if (!user.email || !userPass || !userSalt || !user.mnemonic) {
      throw Error('Wrong user registration data');
    }

    return Model.users.sequelize.transaction(async (t) => Model.users.findOrCreate({
      where: { email: user.email },
      defaults: {
        name: user.name,
        lastname: user.lastname,
        password: userPass,
        mnemonic: user.mnemonic,
        hKey: userSalt,
        referral: user.referral,
        uuid: null,
        credit: user.credit,
        welcomePack: true,
        registerCompleted: user.registerCompleted
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
        const bcryptId = await App.services.Storj.IdToBcrypt(userResult.email);

        const bridgeUser = await App.services.Storj.RegisterBridgeUser(userResult.email, bcryptId);

        if (bridgeUser && bridgeUser.response && (bridgeUser.response.status === 500 || bridgeUser.response.status === 400)) {
          throw Error(bridgeUser.response.data.error);
        }

        if (!bridgeUser.data) {
          throw Error('Error creating bridge user');
        }

        Logger.info('User Service | created brigde user: %s', userResult.email);

        const freeTier = bridgeUser.data ? bridgeUser.data.isFreeTier : 1;
        // Store bcryptid on user register
        await userResult.update({
          userId: bcryptId,
          isFreeTier: freeTier,
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
    .findOne({ where: { email: { [Op.eq]: user.email } } }).then(async (userData) => {
      if (userData.root_folder_id) {
        userData.mnemonic = user.mnemonic;

        return userData;
      }

      const { Storj, Crypt } = App.services;
      const rootBucket = await Storj.CreateBucket(userData.email, userData.userId, user.mnemonic);
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

      return updatedUser;
    }));

  const FindUserByEmail = (email) => new Promise((resolve, reject) => {
    Model.users
      .findOne({ where: { email: { [Op.eq]: email } } }).then((userData) => {
        if (userData) {
          const user = userData.dataValues;
          if (user.mnemonic) user.mnemonic = user.mnemonic.toString();

          resolve(user);
        } else {
          reject(Error('User not found on Drive database'));
        }
      }).catch((err) => reject(err));
  });

  const FindUserByUuid = (userUuid) => Model.users.findOne({ where: { uuid: { [Op.eq]: userUuid } } });

  const FindUserObjByEmail = (email) => Model.users.findOne({ where: { email: { [Op.eq]: email } } });

  const GetUserCredit = (userUuid) => Model.users.findOne({ where: { uuid: { [Op.eq]: userUuid } } }).then((response) => response.dataValues);

  const UpdateCredit = (userUuid) => {
    // Logger.info("€5 added to ", referral);
    Logger.info('€5 added to user with UUID %s', userUuid);

    return Model.users.update({ credit: Sequelize.literal('credit + 5') },
      { where: { uuid: { [Op.eq]: userUuid } } });
  };

  const DecrementCredit = (userUuid) => {
    Logger.info('€5 decremented to user with UUID %s', userUuid);

    return Model.users.update({ credit: Sequelize.literal('credit - 5') },
      { where: { uuid: { [Op.eq]: userUuid } } });
  };

  const DeactivateUser = (email) => new Promise((resolve, reject) => Model.users
    .findOne({ where: { email: { [Op.eq]: email } } }).then((user) => {
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
        Model.users.findOne({ where: { email: { [Op.eq]: userEmail } } }).then(async (user) => {
          if (!user) {
            return;
          }

          try {
            const referralUuid = user.referral;
            if (uuid.validate(referralUuid)) {
              DecrementCredit(referralUuid);
            }

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

  const Store2FA = (user, key) => Model.users
    .update({ secret_2FA: key }, { where: { email: { [Op.eq]: user } } });

  const Delete2FA = (user) => Model.users.update({ secret_2FA: null },
    { where: { email: { [Op.eq]: user } } });

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
      where: { email: { [Op.eq]: user.email } }
    });

    await updatePrivateKey(user, privateKey);
  };

  const LoginFailed = (user, loginFailed) => Model.users.update({
    errorLoginCount: loginFailed ? sequelize.literal('error_login_count + 1') : 0
  }, { where: { email: user } });

  const ResendActivationEmail = (user) => axios.post(`${process.env.STORJ_BRIDGE}/activations`, { email: user });

  const UpdateAccountActivity = (user) => Model.users.update({ updated_at: new Date() }, { where: { email: user } });

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
    where: {
      id: { [Op.eq]: userObject.root_folder_id }
    },
    attributes: ['bucket']
  }).then((folder) => folder.bucket).catch(() => null);

  const UpdateUserSync = async (user, toNull) => {
    let sync = null;
    if (!toNull) {
      sync = getSyncDate();
    }

    await Model.users.update({ syncDate: sync }, { where: { email: user.email } });

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

  const ActivateUser = (token) => axios.get(`${App.config.get('STORJ_BRIDGE')}/activations/${token}`);

  return {
    Name: 'User',
    FindOrCreate,
    FindUserByEmail,
    FindUserObjByEmail,
    FindUserByUuid,
    InitializeUser,
    GetUserCredit,
    UpdateCredit,
    DecrementCredit,
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
    ActivateUser,
    GetUserBucket
  };
};
