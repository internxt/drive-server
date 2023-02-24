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
import { Sign, passportAuth, getTokenExpiredDate } from '../middleware/passport';
import TeamsRoutes from './teams';
import logger from '../../lib/logger';
import * as ReCaptchaV3 from '../../lib/recaptcha';
import * as AnalyticsService from '../../lib/analytics/AnalyticsService';
import { AuthorizedUser } from './types';
import { default as Notifications } from '../../config/initializers/notifications';

const Logger = logger.getInstance();

export default (router: Router, service: any, App: any): Router => {
  service.Analytics = AnalyticsService;
  service.ReCaptcha = ReCaptchaV3;
  service.Notifications = Notifications.getInstance();

  AuthRoutes(router, service, App.config);
  ActivationRoutes(router, service);
  StorageRoutes(router, service);
  BridgeRoutes(router, service);
  StripeRoutes(router, service);
  DesktopRoutes(router, service);
  MobileRoutes(router, service, App);
  TwoFactorRoutes(router, service, App);
  TeamsRoutes(router, service, App);
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
    const internxtClient = req.headers['internxt-client'];

    if (internxtClient === 'drive-desktop') {
      let actualToken = String(req.headers['authorization'] || '');
      if (actualToken.length === 0 || !actualToken.startsWith('Bearer ')) {
        Logger.error(
          `[AUTH/USER/REFRESH] ERROR - Invalid Authorization token: ${actualToken}`
        );
        return res.status(500).send({ error: 'Internal Server Error' });
      }
      actualToken = actualToken.substring(7, actualToken.length); //removes 'Bearer ' from auth header

      const actualTokenExpiredDate = getTokenExpiredDate(actualToken, App.config.get('secrets').JWT);
      const fiveDays = 5 * (24 * 60 * 60);
      const minExpirationDate = Math.floor(Date.now() / 1000) + fiveDays;
      if (minExpirationDate < actualTokenExpiredDate) { //no need to create new token as there's still time left on actualToken's exp
        res.status(200).json({ token: actualToken });
      } else {
        const token = Sign(
          userData.email,
          App.config.get('secrets').JWT,
          true,
        );
        res.status(200).json({ token });
      }
    } else {
      const keyExists = await service.KeyServer.keysExists(userData);

      if (!keyExists && publicKey) {
        await service.KeyServer.addKeysLogin(userData, publicKey, privateKey, revocateKey);
      }

      const keys = await service.KeyServer.getKeys(userData);
      const userBucket = await service.User.GetUserBucket(userData);

      const token = Sign(
        userData.email,
        App.config.get('secrets').JWT,
        internxtClient === 'x-cloud-web' || internxtClient === 'drive-web',
      );

      const hasTeams = !!(await service.Team.getTeamByMember(userData.email));
      const appSumoDetails = await service.AppSumo.GetDetails(userData.id).catch(() => null);

      const user = {
        email: userData.email,
        userId: userData.userId,
        mnemonic: userData.mnemonic,
        root_folder_id: userData.root_folder_id,
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
        teams: hasTeams,
        username: userData.username,
        bridgeUser: userData.bridgeUser,
        sharedWorkspace: userData.sharedWorkspace,
        appSumoDetails: appSumoDetails || null,
        hasReferralsProgram: await service.UsersReferrals.hasReferralsProgram(
          userData.id,
          userData.email,
          userData.bridgeUser,
          userData.userId,
        ),
        backupsBucket: userData.backupsBucket,
        avatar: userData.avatar ? await service.User.getSignedAvatarUrl(userData.avatar) : null,
        emailVerified: userData.emailVerified,
      };
      res.status(200).json({ user, token });
    }
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
        `[AUTH/INITIALIZE] ERROR: ${
          (err as Error).message
        }, BODY ${
          JSON.stringify(req.body)
        }, STACK: ${
          (err as Error).stack
        }`
      );

      return res.status(500).send({ error: 'Internal Server Error' });
    }
  });

  return router;
};
