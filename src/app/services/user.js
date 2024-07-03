import axios from 'axios';
import crypto from 'crypto';
import { MailTypes } from '../models/mailLimit';
const sequelize = require('sequelize');
const bip39 = require('bip39');
const { request } = require('@internxt/lib');
const AnalyticsService = require('../../lib/analytics/AnalyticsService');
const KeyServerService = require('./keyserver');
const CryptService = require('./crypt');
const createHttpError = require('http-errors');
const uuid = require('uuid');
const { default: AvatarS3 } = require('../../config/initializers/avatarS3');

const config = require('../../config/config').default.getInstance();
const AesUtil = require('../../lib/AesUtil');
const MailService = require('./mail');
const UtilsService = require('./utils');
const passport = require('../middleware/passport');
const Logger = require('../../lib/logger').default;
const { default: Redis } = require('../../config/initializers/redis');

const { Op, col, fn } = sequelize;

class UserAlreadyRegisteredError extends Error {
  constructor(userEmail) {
    super(`User ${userEmail || ''} is already registered`);

    Object.setPrototypeOf(this, UserAlreadyRegisteredError.prototype);
  }
}

class DailyInvitationUsersLimitReached extends Error {
  constructor() {
    super('Mail invitation daily limit reached');

    Object.setPrototypeOf(this, DailyInvitationUsersLimitReached.prototype);
  }
}

class DailyDeactivationUserLimitReached extends Error {
  constructor() {
    super('Mail deactivation daily limit reached');

    Object.setPrototypeOf(this, DailyDeactivationUserLimitReached.prototype);
  }
}

class DailyEmailVerificationLimitReached extends Error {
  constructor() {
    super('Mail verification daily limit reached');

    Object.setPrototypeOf(this, DailyEmailVerificationLimitReached.prototype);
  }
}

module.exports = (Model, App) => {
  const logger = Logger.getInstance();
  const KeyServer = KeyServerService(Model, App);
  const CryptServiceInstance = CryptService(Model, App);
  const mailService = MailService(Model, App);
  const utilsService = UtilsService();

  const FindOrCreate = async (user) => {
    // Create password hashed pass only when a pass is given
    const userPass = user.password ? App.services.Crypt.decryptText(user.password) : null;
    const userSalt = user.salt ? App.services.Crypt.decryptText(user.salt) : null;

    // Throw error when user email. pass, salt or mnemonic is missing
    if (!user.email || !userPass || !userSalt || !user.mnemonic) {
      throw Error('Wrong user registration data');
    }

    const transaction = await Model.users.sequelize.transaction();

    try {
      const [userResult, isNewRecord] = await Model.users.findOrCreate({
        where: { username: user.email },
        defaults: {
          email: user.email,
          name: user.name,
          lastname: user.lastname,
          password: userPass,
          mnemonic: user.mnemonic,
          hKey: userSalt,
          referrer: user.referrer,
          referralCode: uuid.v4(),
          uuid: null,
          credit: user.credit,
          welcomePack: true,
          registerCompleted: user.registerCompleted,
          username: user.username,
          bridgeUser: user.bridgeUser,
        },
        transaction,
      });

      if (isNewRecord) {
        if (user.publicKey && user.privateKey && user.revocationKey) {
          await Model.keyserver.findOrCreate({
            where: { user_id: userResult.id },
            defaults: {
              user_id: user.id,
              private_key: user.privateKey,
              public_key: user.publicKey,
              revocation_key: user.revocationKey,
              encrypt_version: null,
            },
            transaction,
          });
        }

        // Create bridge pass using email (because id is unconsistent)
        const bcryptId = await App.services.Inxt.IdToBcrypt(userResult.email);
        const bridgeUser = await App.services.Inxt.RegisterBridgeUser(userResult.email, bcryptId);

        if (
          bridgeUser &&
          bridgeUser.response &&
          (bridgeUser.response.status === 500 || bridgeUser.response.status === 400)
        ) {
          throw Error(bridgeUser.response.data.error);
        }

        if (!bridgeUser.data) {
          throw Error('Error creating bridge user');
        }

        logger.info('User Service | created brigde user: %s', userResult.email);

        await userResult.update(
          {
            userId: bcryptId,
            uuid: bridgeUser.data.uuid,
          },
          { transaction },
        );

        // Set created flag for Frontend management
        Object.assign(userResult, { isNewRecord });
      }

      await transaction.commit();

      // TODO: Move on wip to the repository
      userResult.mnemonic = userResult.mnemonic.toString();

      return userResult;
    } catch (err) {
      await transaction.rollback();

      throw err;
    }
  };

  const InitializeUser = (user) =>
    Model.users.sequelize.transaction((t) =>
      Model.users.findOne({ where: { username: { [Op.eq]: user.email } } }).then(async (userData) => {
        if (userData.root_folder_id) {
          userData.mnemonic = user.mnemonic;

          return userData;
        }

        const { Inxt, Crypt } = App.services;
        const rootBucket = await Inxt.CreateBucket(userData.email, userData.userId, user.mnemonic);
        logger.info('User init | root bucket created %s', rootBucket.name);

        const rootFolderName = await Crypt.encryptName(`${rootBucket.name}`);
        const rootFolder = await userData.createFolder({
          name: rootFolderName,
          bucket: rootBucket.id,
        });

        logger.info('User init | root folder created, id: %s', rootFolder.id);

        // Update user register with root folder Id
        await userData.update({ root_folder_id: rootFolder.id }, { transaction: t });

        // Set decrypted mnemonic to returning object
        const updatedUser = userData;
        updatedUser.mnemonic = user.mnemonic;
        updatedUser.bucket = rootBucket.id;

        return updatedUser;
      }),
    );

  const FindUserByEmail = (email) =>
    new Promise((resolve, reject) => {
      Model.users
        .findOne({ where: { username: { [Op.eq]: email } } })
        .then((userData) => {
          if (!userData) {
            return reject(Error('Wrong login credentials'));
          }

          const user = userData.dataValues;

          if (user.mnemonic) {
            user.mnemonic = user.mnemonic.toString();
          }

          return resolve(user);
        })
        .catch((err) => reject(err));
    });

  const findById = (id) => Model.users.findOne({ where: { id } });

  const FindUserByUuid = (userUuid) => Model.users.findOne({ where: { uuid: { [Op.eq]: userUuid } } });

  const FindUserObjByEmail = (email) => Model.users.findOne({ where: { username: { [Op.eq]: email } } });

  const deactivate = async (email) => {
    const user = await Model.users.findOne({ where: { username: { [Op.eq]: email } } });

    if (!user) {
      throw new Error('User not found');
    }

    const [mailLimit] = await Model.mailLimit.findOrCreate({
      where: {
        userId: user.id,
        mailType: MailTypes.DeactivateUser,
      },
      defaults: {
        attemptsCount: 0,
        attemptsLimit: 10,
      },
    });

    if (utilsService.isToday(mailLimit.lastMailSent) && mailLimit.attemptsCount >= mailLimit.attemptsLimit) {
      throw new DailyDeactivationUserLimitReached();
    }

    const attemptsCount = utilsService.isToday(mailLimit.lastMailSent) ? mailLimit.attemptsCount + 1 : 1;

    await Model.mailLimit.update(
      {
        attemptsCount,
        lastMailSent: new Date(),
      },
      {
        where: {
          userId: user.id,
          mailType: MailTypes.DeactivateUser,
        },
      },
    );

    const pass = crypto.createHash('sha256').update(user.userId).digest('hex');
    const auth = Buffer.from(`${user.email}:${pass}`).toString('base64');
    const deactivator = crypto.randomBytes(256).toString('hex');
    const deactivationUrl = `${process.env.HOST_DRIVE_WEB}/deactivations/${deactivator}`;

    return sendDeactivateEmail(auth, email, deactivationUrl, deactivator);
  };

  const sendDeactivateEmail = (auth, email, deactivationUrl, deactivator) => {
    const host = App.config.get('STORJ_BRIDGE');

    return axios
      .delete(`${host}/users/${email}?redirect=${deactivationUrl}&deactivator=${deactivator}`, {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      })
      .catch((err) => {
        throw new Error(request.extractMessageFromError(err));
      });
  };

  const confirmDeactivate = async (token) => {
    let user;

    try {
      const userEmail = await axios
        .get(`${App.config.get('STORJ_BRIDGE')}/deactivationStripe/${token}`, {
          headers: { 'Content-Type': 'application/json' },
        })
        .then((res) => {
          return res.data.email;
        });

      user = await Model.users.findOne({ where: { username: userEmail } });

      if (!user) {
        throw new Error('User not found');
      }

      // DELETE FOREIGN KEYS (not cascade)
      user.root_folder_id = null;
      await user.save();
      const keys = await user.getKeyserver();
      if (keys) {
        await keys.destroy();
      }

      const appSumo = await user.getAppSumo();
      if (appSumo) {
        await appSumo.destroy();
      }

      await Model.backup.destroy({ where: { userId: user.id } });
      await Model.device.destroy({ where: { userId: user.id } });

      await user.destroy();

      await Model.folder.update(
        { deleted: true, removed: true },
        {
          where: {
            user_id: user.id,
            parent_id: null,
          },
        },
      );

      logger.info('User %s confirmed deactivation', userEmail);
    } catch (err) {
      if (user) {
        const tempUsername = `${user.email}-${crypto.randomBytes(5).toString('hex')}-DELETED`;

        user.email = tempUsername;
        user.username = tempUsername;
        user.bridgeUser = tempUsername;
        await user.save();

        throw new Error(`Deactivation error for user ${user.email} (renamed to ${tempUsername}): ${err.message}`);
      } else {
        throw new Error(err.message);
      }
    }
  };

  const Store2FA = (user, key) => Model.users.update({ secret_2FA: key }, { where: { username: { [Op.eq]: user } } });

  const Delete2FA = (user) => Model.users.update({ secret_2FA: null }, { where: { username: { [Op.eq]: user } } });

  const updatePrivateKey = (user, privateKey) => {
    return Model.keyserver.update(
      {
        private_key: privateKey,
      },
      {
        where: { user_id: { [Op.eq]: user.id } },
      },
    );
  };

  const UpdatePasswordMnemonic = async (user, currentPassword, newPassword, newSalt, mnemonic, privateKey) => {
    const storedPassword = user.password.toString();
    if (storedPassword !== currentPassword) {
      throw Error('Invalid password');
    }

    await Model.users.update(
      {
        password: newPassword,
        mnemonic,
        hKey: newSalt,
        lastPasswordChangedAt: new Date(),
      },
      {
        where: { username: { [Op.eq]: user.email } },
      },
    );

    await updatePrivateKey(user, privateKey);
  };

  const recoverPassword = async (user, newPassword, newSalt, oldMnemonic, oldPrivateKey) => {
    // Update password, salt & mnemonic
    user.hKey = newSalt;
    user.mnemonic = oldMnemonic;
    user.password = newPassword;
    user.lastPasswordChangedAt = new Date();
    await user.save();

    const keys = await user.getKeyserver();
    if (!oldPrivateKey) {
      keys.destroy();
    } else {
      keys.private_key = oldPrivateKey;
      await keys.save().catch(() => {
        // eslint-disable-next-line no-empty
      });
    }
  };

  const LoginFailed = (user, loginFailed) =>
    Model.users.update(
      {
        errorLoginCount: loginFailed ? sequelize.literal('error_login_count + 1') : 0,
      },
      { where: { username: user } },
    );

  const ResendActivationEmail = (user) => axios.post(`${process.env.STORJ_BRIDGE}/activations`, { email: user });

  const UpdateAccountActivity = (user) => Model.users.update({ updated_at: new Date() }, { where: { username: user } });

  const GetUserBucket = (userObject) =>
    Model.folder
      .findOne({
        where: { id: { [Op.eq]: userObject.root_folder_id } },
        attributes: ['bucket'],
      })
      .then((folder) => folder.bucket)
      .catch(() => null);

  const RegisterUser = async (newUserData) => {
    logger.warn('[AUTH/REGISTER] Register request for %s', newUserData.email);

    if (!(newUserData.email && newUserData.password)) {
      throw createHttpError(400, 'You must provide registration data');
    }

    const hasReferrer = !!newUserData.referrer;
    const referrer = hasReferrer
      ? await Model.users.findOne({ where: { referralCode: { [Op.eq]: newUserData.referrer } } })
      : null;

    if (hasReferrer && !referrer) {
      throw createHttpError(400, 'The referral code used is not correct');
    }

    const email = newUserData.email.toLowerCase().trim();
    const userData = await FindOrCreate({
      ...newUserData,
      email,
      username: email,
      bridgeUser: email,
      credit: 0,
    });

    if (!userData) {
      throw createHttpError(409, 'Email adress already used');
    }

    if (!userData.isNewRecord) {
      throw createHttpError(409, 'This account already exists');
    }

    if (hasReferrer) {
      AnalyticsService.trackInvitationAccepted(userData.uuid, referrer.uuid, referrer.email);
      await Model.FriendInvitation.update({ accepted: true }, { where: { host: referrer.id, guestEmail: email } });
      await App.services.UsersReferrals.applyUserReferral(referrer.id, 'invite-friends');
    }

    // Successfull register
    const token = passport.Sign(userData.email, App.config.get('secrets').JWT, true);

    // Creates user referrals
    await App.services.UsersReferrals.createUserReferrals(userData.id);

    const user = {
      userId: userData.userId,
      mnemonic: userData.mnemonic.toString(),
      root_folder_id: userData.root_folder_id,
      name: userData.name,
      lastname: userData.lastname,
      uuid: userData.uuid,
      credit: userData.credit,
      createdAt: userData.createdAt,
      registerCompleted: userData.registerCompleted,
      email: userData.email,
      username: userData.username,
      bridgeUser: userData.bridgeUser,
      sharedWorkspace: userData.sharedWorkspace,
      appSumoDetails: null,
      hasReferralsProgram: true,
      backupsBucket: userData.backupsBucket,
      referralCode: userData.referralCode,
    };

    try {
      const keys = await KeyServer.getKeys(userData);
      user.privateKey = keys.private_key;
      user.publicKey = keys.public_key;
      user.revocationKey = keys.revocation_key;
    } catch (e) {
      logger.error(`[AUTH/REGISTER] ERROR GETTING KEYS: ${e.message}. STACK ${e.stack}`);
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
    Redis.getInstance();
    const cachedUsage = await Redis.getUsage(user.uuid);
    let driveUsage = 0;

    if (cachedUsage) {
      logger.info('Cache hit for user ' + user.uuid);
      driveUsage = cachedUsage;
    } else {
      const usage = await Model.file.findAll({
        where: { user_id: user.id, status: { [Op.ne]: 'DELETED' } },
        attributes: [[fn('sum', col('size')), 'total']],
        raw: true,
      });

      driveUsage = parseInt(usage[0].total);

      await Redis.setUsage(user.uuid, driveUsage);
    }

    const backupsQuery = await Model.backup.findAll({
      where: { userId: user.id },
      attributes: [[fn('sum', col('size')), 'total']],
      raw: true,
    });

    const backupsUsage = parseInt(backupsQuery[0].total ? backupsQuery[0].total : 0);

    return {
      total: driveUsage + backupsUsage,
      _id: user.email,
      drive: driveUsage || 0,
      backups: backupsUsage,
    };
  };

  const UpdateUserStorage = async (email, maxSpaceBytes) => {
    const { GATEWAY_USER, GATEWAY_PASS } = process.env;

    return axios.post(
      `${process.env.STORJ_BRIDGE}/gateway/upgrade`,
      {
        email,
        bytes: parseInt(maxSpaceBytes, 10),
      },
      {
        headers: { 'Content-Type': 'application/json' },
        auth: { username: GATEWAY_USER, password: GATEWAY_PASS },
      },
    );
  };

  const CreateStaggingUser = async (email) => {
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
      sharedWorkspace: false,
      bridgeUser: email,
    };

    const user = await FindOrCreate(userObject);
    return user;
  };

  const invite = async ({ inviteEmail, hostEmail, hostUserId, hostFullName, hostReferralCode }) => {
    let mailLimit = await Model.mailLimit.findOne({
      where: {
        userId: hostUserId,
        mailType: MailTypes.InviteFriend,
      },
    });

    let limitAlreadyExists = false;

    if (!mailLimit) {
      mailLimit = await Model.mailLimit.create({
        userId: hostUserId,
        mailType: MailTypes.InviteFriend,
        attemptsCount: 0,
        attemptsLimit: 10,
      });
    } else {
      limitAlreadyExists = true;
    }

    const limitReached = mailLimit.attemptsCount >= mailLimit.attemptsLimit;
    const lastMailWasSentToday = utilsService.isToday(mailLimit.lastMailSent);

    if (lastMailWasSentToday) {
      if (limitReached) {
        throw new DailyInvitationUsersLimitReached();
      }
    } else if (limitAlreadyExists) {
      mailLimit.attemptsCount = 0;
    }

    const userToInviteAlreadyExists = await Model.users.findOne({ where: { email: inviteEmail } });

    if (!userToInviteAlreadyExists) {
      await mailService.sendInviteFriendMail({
        inviteEmail,
        hostEmail,
        hostFullName,
        registerUrl: `${process.env.HOST_DRIVE_WEB}/new?ref=${hostReferralCode}`,
      });
      await Model.mailLimit.update(
        {
          attemptsCount: mailLimit.attemptsCount + 1,
          lastMailSent: new Date(),
        },
        {
          where: {
            userId: hostUserId,
            mailType: MailTypes.InviteFriend,
          },
        },
      );
    }

    const alreadyExistingFriendInvitation = await Model.FriendInvitation.findOne({
      where: { guestEmail: inviteEmail, host: hostUserId },
    });

    if (!alreadyExistingFriendInvitation) {
      await Model.FriendInvitation.create({ host: hostUserId, guestEmail: inviteEmail });
    }
  };

  const CompleteInfo = async (user, info) => {
    if (user.registerCompleted) {
      throw Error('User info is up to date');
    }
    const cPassword = CryptServiceInstance.RandomPassword(user.email);
    const cSalt = user.hKey.toString();
    const hashedCurrentPassword = CryptServiceInstance.passToHash({ password: cPassword, salt: cSalt }).hash;

    const newPassword = CryptServiceInstance.decryptText(info.password);
    const newSalt = CryptServiceInstance.decryptText(info.salt);

    user.name = info.name;
    user.lastname = info.lastname;
    // user.registerCompleted = true;
    await user.save();
    await UpdatePasswordMnemonic(user, hashedCurrentPassword, newPassword, newSalt, info.mnemonic);

    // Finish
    user.registerCompleted = true;
    user.sharedWorkspace = false;
    return user.save();
  };

  const findWorkspaceMembers = async (bridgeUser) => {
    return Model.users.findAll({ where: { bridgeUser } });
  };

  const modifyProfile = async (email, { name, lastname }) => {
    return Model.users.update({ name, lastname }, { where: { email } });
  };

  const getSignedAvatarUrl = async (avatarKey) => {
    const s3 = AvatarS3.getInstance();
    const url = await s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.AVATAR_BUCKET,
      Key: avatarKey,
      Expires: 24 * 3600,
    });

    const endpointRewrite = process.env.AVATAR_ENDPOINT_REWRITE_FOR_SIGNED_URLS;
    if (endpointRewrite) {
      return url.replace(process.env.AVATAR_ENDPOINT, endpointRewrite);
    } else {
      return url;
    }
  };

  const deleteAvatarInS3 = (avatarKey) => {
    const s3 = AvatarS3.getInstance();
    return s3.deleteObject({ Bucket: process.env.AVATAR_BUCKET, Key: avatarKey }).promise();
  };

  const upsertAvatar = async (user, newAvatarKey) => {
    await Model.users.update({ avatar: newAvatarKey }, { where: { id: user.id } });

    if (user.avatar) {
      try {
        await deleteAvatarInS3(user.avatar);
      } catch (err) {
        logger.error(`Error while deleting already existing avatar for user ${user.email}: ${err.message}`);
      }
    }
    return { avatar: await getSignedAvatarUrl(newAvatarKey) };
  };

  const deleteAvatar = async (user) => {
    if (!user.avatar) return;

    await deleteAvatarInS3(user.avatar);
    return Model.users.update({ avatar: null }, { where: { id: user.id } });
  };

  const updateTier = async (user, tierId) => {
    return Model.users.update({ tierId }, { where: { uuid: user.uuid } });
  };

  const getFriendInvites = async (id) => {
    return Model.FriendInvitation.findAll({ where: { host: id } });
  };

  const sendEmailVerification = async (user) => {
    const [mailLimit] = await Model.mailLimit.findOrCreate({
      where: {
        userId: user.id,
        mailType: MailTypes.EmailVerification,
      },
      defaults: {
        attemptsCount: 0,
        attemptsLimit: 10,
      },
    });

    if (utilsService.isToday(mailLimit.lastMailSent) && mailLimit.attemptsCount >= mailLimit.attemptsLimit) {
      throw new DailyEmailVerificationLimitReached();
    }

    const attemptsCount = utilsService.isToday(mailLimit.lastMailSent) ? mailLimit.attemptsCount + 1 : 1;

    await Model.mailLimit.update(
      {
        attemptsCount,
      },
      {
        where: {
          userId: user.id,
          mailType: MailTypes.EmailVerification,
          lastMailSent: new Date(),
        },
      },
    );

    const secret = config.get('secrets').JWT;
    const verificationToken = AesUtil.encrypt(user.uuid, Buffer.from(secret));

    const verificationTokenEncoded = encodeURIComponent(verificationToken);

    const url = `${process.env.HOST_DRIVE_WEB}/verify-email/${verificationTokenEncoded}`;

    await mailService.sendVerifyEmailMail(user.email, { url });
  };

  const verifyEmail = async (verificationToken) => {
    const secret = config.get('secrets').JWT;

    let uuid;

    try {
      uuid = AesUtil.decrypt(verificationToken, Buffer.from(secret));
    } catch (err) {
      logger.error(`[AUTH/VERIFICATION] Error while validating verificationToken (verifyEmail) ${err.message}`);
      throw createHttpError(400, `Could not verify this verificationToken: "${verificationToken}"`);
    }

    try {
      await Model.users.update({ emailVerified: true }, { where: { uuid } });
    } catch (err) {
      logger.error(
        `[AUTH/VERIFICATION] Error while trying to set verifyEmail to true for user ${uuid}: ${err.message}`,
      );
    }
  };

  const getUserNotificationTokens = async (userUuid, type = null) => {
    let whereClause = { userId: userUuid };

    if (type !== null) {
      whereClause.type = type;
    }
    return Model.userNotificationToken.findAll({ where: whereClause });
  };

  const deleteUserNotificationTokens = async (userUuid, tokens) => {
    return Model.userNotificationToken.destroy({
      where: {
        userId: userUuid,
        token: {
          [Op.in]: tokens,
        },
      },
    });
  };

  return {
    Name: 'User',
    FindOrCreate,
    RegisterUser,
    findById,
    FindUserByEmail,
    FindUserObjByEmail,
    FindUserByUuid,
    InitializeUser,
    Store2FA,
    Delete2FA,
    UpdatePasswordMnemonic,
    LoginFailed,
    ResendActivationEmail,
    UpdateAccountActivity,
    GetUserBucket,
    UpdateUserStorage,
    CreateStaggingUser,
    CompleteInfo,
    getUsage,
    updateKeys,
    recoverPassword,
    invite,
    deactivate,
    confirmDeactivate,
    findWorkspaceMembers,
    UserAlreadyRegisteredError,
    DailyInvitationUsersLimitReached,
    modifyProfile,
    upsertAvatar,
    deleteAvatar,
    getSignedAvatarUrl,
    getFriendInvites,
    sendEmailVerification,
    verifyEmail,
    updateTier,
    getUserNotificationTokens,
    deleteUserNotificationTokens,
  };
};
