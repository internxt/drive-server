const axios = require('axios');
const sequelize = require('sequelize');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const Logger = App.logger;

  const UserFindOrCreate = (user) => {
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

  /**
   * If not exists user on Photos database, creates a new photos user entry.
   */
  const UserPhotosFindOrCreate = (newUser) => {
    return Model.usersphotos.sequelize.transaction(async () => Model.usersphotos
      .findOrCreate({
        where: { user_id: newUser.id },
        defaults: {
          userId: newUser.id,
          rootAlbumId: null,
          rootPreviewId: null
        }
      })
      .then(async (userResult, created) => {
        if (created) {
          // Set created flag for Frontend management
          Object.assign(userResult, { isCreated: created });
        }
        return userResult;
      })
      .catch((err) => {
        if (err.response) {
          // This happens when email is registered in bridge
          Logger.error(err.response.data);
        } else {
          Logger.error(err.stack);
        }

        throw Error(err);
      })); // end transaction
  };

  const InitializeUserPhotos = (user) => Model.users.findOne({ where: { email: { [Op.eq]: user.email } } }).then(async (userData) => {
    userData.mnemonic = user.mnemonic;

    const userPhotos = await Model.usersphotos.findOne({ where: { user_id: userData.id } });

    if (userPhotos && (userPhotos.rootAlbumId && userPhotos.rootPreviewId)) {
      throw Error('User Photos already initializaed');
    }

    // Create photos bucket
    const rootAlbumBucket = await App.services.StorjPhotos.CreatePhotosBucket(userData.email, userData.userId, user.mnemonic, 'photosbucket');
    Logger.info('User init | Photos root bucket created %s', rootAlbumBucket.name);

    // Create previews bucket
    const rootPreviewBucket = await App.services.StorjPhotos.CreatePhotosBucket(userData.email, userData.userId, user.mnemonic, 'previewsbucket');
    Logger.info('User init | Root previews bucket created %s', rootPreviewBucket.name);

    // Update user register with root album Id
    return Model.usersphotos.findOrCreate({
      where: { user_id: userData.id },
      defaults: {
        userId: userData.id,
        rootAlbumId: rootAlbumBucket.id,
        rootPreviewId: rootPreviewBucket.id
      }
    }).then((userResult, created) => {
      if (created) {
        // Set created flag for Frontend management
        Object.assign(userResult, { isCreated: created });
      }
      return userResult;
    }).catch((err) => {
      if (err.response) {
        // This happens when email is registered in bridge
        Logger.error(err.response.data);
      } else {
        Logger.error(err.stack);
      }

      throw Error(err);
    });
  })
    .catch((error) => {
      Logger.error(error.stack);
      throw Error(error);
    });

  const GetUserById = (id) => Model.usersPhotos.findOne({ where: { id: { [Op.eq]: id } } });

  const FindUserById = (id) => Model.usersphotos.findOne({ where: { userId: { [Op.eq]: id } } });

  const FindUserByEmail = (email) => Model.users.findOne({
    where: { email: { [Op.eq]: email } },
    include: [{ model: Model.usersphotos }]
  });

  const FindUserByUuid = (userUuid) => Model.users.findOne({ where: { uuid: { [Op.eq]: userUuid } } });

  const GetUserRootAlbum = () => Model.usersPhotos.findAll({ include: [Model.album] });

  const ActivateUser = (token) => axios.get(`${App.config.get('STORJ_BRIDGE')}/photos/activations/${token}`);

  return {
    Name: 'UserPhotos',
    UserFindOrCreate,
    UserPhotosFindOrCreate,
    InitializeUserPhotos,
    GetUserById,
    FindUserById,
    FindUserByEmail,
    FindUserByUuid,
    GetUserRootAlbum,
    ActivateUser
  };
};
