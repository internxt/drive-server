import { Router } from 'express';
import createHttpError from 'http-errors';

import AuthRoutes from './auth';
import ActivationRoutes from './activation';
import StorageRoutes from './storage';
import BridgeRoutes from './bridge';
import StripeRoutes from './stripe';
import DesktopRoutes from './desktop';
import MobileRoutes from './mobile';
import TwoFactorRoutes from './twofactor';
import AppSumoRoutes from './appsumo';
import PlanRoutes from './plan';
import ShareRoutes from './share';
import BackupsRoutes from './backup';
import GuestRoutes from './guest';
import GatewayRoutes from './gateway';
import UsersReferralsRoutes from './usersReferrals';
import NewsletterRoutes from './newsletter';
import UserRoutes from './user';
import AnalyticsRoutes from './analytics';
import { Sign, passportAuth, SignNewToken } from '../middleware/passport';
import logger from '../../lib/logger';
import * as ReCaptchaV3 from '../../lib/recaptcha';
import * as AnalyticsService from '../../lib/analytics/AnalyticsService';
import { AuthorizedUser } from './types';
import { default as Notifications } from '../../config/initializers/notifications';
import { default as Apn } from '../../config/initializers/apn';

const Logger = logger.getInstance();

export default (router: Router, service: any, App: any): Router => {
  service.Analytics = AnalyticsService;
  service.ReCaptcha = ReCaptchaV3;
  service.Notifications = Notifications.getInstance();
  service.Apn = Apn.getInstance();

  AuthRoutes(router, service, App.config);
  ActivationRoutes(router, service);
  StorageRoutes(router, service);
  BridgeRoutes(router, service);
  StripeRoutes(router, service);
  DesktopRoutes(router, service);
  MobileRoutes(router, service, App);
  TwoFactorRoutes(router, service, App);
  AppSumoRoutes(router, service, App);
  PlanRoutes(router, service);
  ShareRoutes(router, service);
  BackupsRoutes(router, service);
  GuestRoutes(router, service);
  GatewayRoutes(router, service);
  UsersReferralsRoutes(router, service);
  NewsletterRoutes(router, service);
  UserRoutes(router, service, App);
  AnalyticsRoutes(router);

  router.get('/user/refresh', passportAuth, async (req, res) => {
    const { publicKey, privateKey, revocateKey } = req.body;
    const userData: any = (req as AuthorizedUser).user;

    let [keys, userBucket] = await Promise.all([
      service.KeyServer.getKeys(userData),
      service.User.GetUserBucket(userData),
    ]);

    const keyExists = !!keys;

    if (!keyExists && publicKey) {
      await service.KeyServer.addKeysLogin(userData, publicKey, privateKey, revocateKey);
      keys = await service.KeyServer.getKeys(userData);
    }

    const token = Sign(userData.email, App.config.get('secrets').JWT, true);
    const newToken = SignNewToken(userData, App.config.get('secrets').JWT, true);

    const rootFolder = await service.Folder.getById(userData.root_folder_id);

    const user = {
      email: userData.email,
      userId: userData.userId,
      mnemonic: userData.mnemonic,
      root_folder_id: userData.root_folder_id,
      rootFolderId: rootFolder?.uuid,
      name: userData.name,
      lastname: userData.lastname,
      uuid: userData.uuid,
      credit: userData.credit,
      createdAt: userData.createdAt,
      privateKey: keys ? keys.private_key : null,
      publicKey: keys ? keys.public_key : null,
      revocateKey: keys ? keys.revocation_key : null,
      bucket: userBucket,
      registerCompleted: userData.registerCompleted,
      teams: false,
      username: userData.username,
      bridgeUser: userData.bridgeUser,
      sharedWorkspace: userData.sharedWorkspace,
      appSumoDetails: null,
      hasReferralsProgram: false,
      backupsBucket: userData.backupsBucket,
      avatar: userData.avatar ? await service.User.getSignedAvatarUrl(userData.avatar) : null,
      emailVerified: userData.emailVerified,
      lastPasswordChangedAt: userData.lastPasswordChangedAt,
    };

    res.status(200).json({ user, token, newToken });
  });

  router.post('/initialize', async (req, res) => {
    try {
      const userData: any = await service.User.InitializeUser(req.body);

      if (!userData.root_folder_id) {
        throw createHttpError(500, 'Account can not be initialized');
      }

      const user = {
        email: userData.email,
        bucket: userData.bucket,
        mnemonic: userData.mnemonic,
        root_folder_id: userData.root_folder_id,
      };

      (await service.Folder.Create(userData, 'Family', user.root_folder_id)).save();
      (await service.Folder.Create(userData, 'Personal', user.root_folder_id)).save();

      res.status(200).send({ user });
    } catch (err) {
      Logger.error(
        `[AUTH/INITIALIZE] ERROR: ${(err as Error).message}, BODY ${JSON.stringify(req.body)}, STACK: ${
          (err as Error).stack
        }`,
      );

      return res.status(500).send({ error: 'Internal Server Error' });
    }
  });

  return router;
};
