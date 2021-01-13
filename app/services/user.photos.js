const axios = require('axios');
const sequelize = require('sequelize');
const async = require('async');
const uuid = require('uuid');
// const Analytics = require('./analytics')
const crypto = require('crypto-js');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const Logger = App.logger;

  const UserFindOrCreate = (user) => {
    // Create password hashed pass only when a pass is given
    const userPass = user.password ? App.services.Crypt.decryptText(user.password) : null;
    const userSalt = user.salt ? App.services.Crypt.decryptText(user.salt) : null;

    // Throw error when user email. pass, salt or mnemonic is missing
    if (!user.email || !userPass || !userSalt || !user.mnemonic) {
      throw new Error('Wrong user registration data');
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
        referred: user.referred,
        credit: user.credit,
        welcomePack: false
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

        if (bridgeUser && bridgeUser.response && bridgeUser.response.status === 500) {
          throw Error(bridgeUser.response.data.error);
        }

        if (!bridgeUser.data) {
          throw new Error('Error creating bridge user');
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

      throw new Error(err);
    })); // end transaction
  };

  /**
   * If not exists user on database, creates a new photos user entry.
   */
  const UserPhotosFindOrCreate = (user) => {
    // Create password hashed pass only when a pass is given
    const userPass = user.password ? App.services.Crypt.decryptText(user.password) : null;
    const userSalt = user.salt ? App.services.Crypt.decryptText(user.salt) : null;

    // Throw error when user email. pass, salt or mnemonic is missing
    if (!user.email || !userPass || !userSalt || !user.mnemonic) {
      throw new Error('Wrong user registration data');
    }

    return Model.usersPhotos.sequelize.transaction(async (t) => Model.usersPhotos
      .findOrCreate({
        where: { user_id: user.userId },
        defaults: {
          name: user.name,
          lastname: user.lastname,
          password: userPass,
          mnemonic: user.mnemonic,
          hKey: userSalt,
          referral: user.referral,
          uuid: null,
          referred: user.referred,
          credit: user.credit,
          welcomePack: true
        },
        transaction: t
      })
      .spread(async (userResult, created) => {
        if (created) {
          // Create bridge pass using email (because id is unconsistent)
          const bcryptId = await App.services.StorjPhotos.IdToBcrypt(
            userResult.email
          );

          const bridgeUser = await App.services.StorjPhotos.RegisterBridgeUser(
            userResult.email,
            bcryptId
          );

          if (bridgeUser && bridgeUser.response && bridgeUser.response.status === 500) {
            throw Error(bridgeUser.response.data.error);
          }

          if (!bridgeUser.data) {
            throw new Error('Error creating bridge user');
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
          Object.assign(userResult, { isCreated: created });
        }

        // TODO: proveriti userId kao pass
        return userResult;
      })
      .catch((err) => {
        if (err.response) {
          // This happens when email is registered in bridge
          Logger.error(err.response.data);
        } else {
          Logger.error(err.stack);
        }

        throw new Error(err);
      })); // end transaction
  };

  /**
   * Create user bucket on the network when log in.
   * @param user
   */
  const InitializeUserPhotos = (user) => Model.usersPhotos.sequelize.transaction((t) => Model.usersPhotos
    .findOne({ where: { email: { [Op.eq]: user.email } } })
    .then(async (userData) => {
      if (userData.root_album_id) {
        userData.mnemonic = user.mnemonic;

        return userData;
      }

      const rootBucket = await App.services.StorjPhotos.CreatePhotosBucket(userData.email, userData.userId, user.mnemonic);
      Logger.info('User init | Photos root bucket created %s', rootBucket.name);

      const rootAlbumName = await App.services.Crypt.encryptName(`${rootBucket.name}`);

      const rootAlbum = await userData.createFolder({ name: rootAlbumName, bucket: rootBucket.id });

      Logger.info('User init | Photos root folder created, id: %s', rootAlbum.id);

      // Update user register with root folder Id
      await userData.update(
        { root_album_id: rootAlbum.id },
        { transaction: t }
      );

      // Set decrypted mnemonic to returning object
      const updatedUser = userData;
      updatedUser.mnemonic = user.mnemonic;

      return updatedUser;
    })
    .catch((error) => {
      Logger.error(error.stack);
      throw new Error(error);
    }));

  const GetUserById = (id) => Model.usersPhotos.findOne({
    where: {
      id: { [Op.eq]: id }
    }
  }).then((response) => response.dataValues);

  const FindUserByEmail = (email) => new Promise((resolve, reject) => {
    Model.users
      .findOne({ where: { email: { [Op.eq]: email } } })
      .then((userData) => {
        if (userData) {
          const user = userData.dataValues;
          if (user.mnemonic) user.mnemonic = user.mnemonic.toString();

          resolve(user);
        } else {
          reject(Error('User not found on Inxt Photos database'));
        }
      })
      .catch((err) => reject(err));
  });

  const FindUserByUuid = (userUuid) => Model.usersPhotos.findOne({
    where: {
      uuid: { [Op.eq]: userUuid }
    }
  });

  const GetUserRootAlbum = () => Model.usersPhotos
    .findAll({
      include: [Model.album]
    })
    .then((user) => user.dataValues);

  const ActivateUser = (token) => {
    return axios.get(`${App.config.get('STORJ_BRIDGE')}/photos/activations/${token}`);
  };

  return {
    Name: 'UserPhotos',
    UserFindOrCreate,
    UserPhotosFindOrCreate,
    InitializeUserPhotos,
    GetUserById,
    FindUserByEmail,
    FindUserByUuid,
    GetUserRootAlbum,
    ActivateUser
  };
};
