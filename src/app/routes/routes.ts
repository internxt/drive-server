import { Router } from 'express';
import speakeasy from 'speakeasy';
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
import PhotosRoutes from './photos';
import ShareRoutes from './share';
import BackupsRoutes from './backup';
import GuestRoutes from './guest';
import GatewayRoutes from './gateway';
import UsersReferralsRoutes from './usersReferrals';
import NewsletterRoutes from './newsletter';
import UserRoutes from './user';
import AnalyticsRoutes from './analytics';
import { Sign, passportAuth } from '../middleware/passport';
import TeamsRoutes from './teams';
import logger from '../../lib/logger';
import * as ReCaptchaV3 from '../../lib/recaptcha';
import * as AnalyticsService from '../../lib/analytics/AnalyticsService';
import { UserAttributes } from '../models/user';
import { AuthorizedUser } from './types';

const Logger = logger.getInstance();

export default (router: Router, service: any, App: any): Router => {
  service.Analytics = AnalyticsService;
  service.ReCaptcha = ReCaptchaV3;

  AuthRoutes(router, service);
  ActivationRoutes(router, service);
  StorageRoutes(router, service, App);
  BridgeRoutes(router, service);
  StripeRoutes(router, service);
  DesktopRoutes(router, service);
  MobileRoutes(router, service, App);
  TwoFactorRoutes(router, service, App);
  TeamsRoutes(router, service, App);
  AppSumoRoutes(router, service, App);
  PlanRoutes(router, service);
  PhotosRoutes(router, service, App);
  ShareRoutes(router, service);
  BackupsRoutes(router, service);
  GuestRoutes(router, service);
  GatewayRoutes(router, service);
  UsersReferralsRoutes(router, service);
  NewsletterRoutes(router, service);
  UserRoutes(router, service, App);
  AnalyticsRoutes(router);

  router.post('/login', async (req, res) => {
    if (!req.body.email) {
      throw createHttpError(400, 'Missing email param');
    }

    try {
      req.body.email = req.body.email.toLowerCase();
    } catch (e) {
      throw createHttpError(400, 'Invalid email');
    }

    let user: UserAttributes;
    try {
      user = await service.User.FindUserByEmail(req.body.email);
    } catch {
      throw createHttpError(401, 'Wrong email/password');
    }

    const encSalt = App.services.Crypt.encryptText(user.hKey.toString());
    const required2FA = user.secret_2FA && user.secret_2FA.length > 0;

    const hasKeys = await service.KeyServer.keysExists(user);

    res.status(200).send({ hasKeys, sKey: encSalt, tfa: required2FA });
  });

  router.post('/access', async (req, res) => {
    const MAX_LOGIN_FAIL_ATTEMPTS = 10;

    const userData: any = await service.User.FindUserByEmail(req.body.email);

    if (!userData) {
      throw createHttpError(401, 'Wrong email/password');
    }

    const loginAttemptsLimitReached = userData.errorLoginCount >= MAX_LOGIN_FAIL_ATTEMPTS;

    if (loginAttemptsLimitReached) {
      throw createHttpError(401, 'Your account has been blocked for security reasons. Please reach out to us');
    }

    const hashedPass = App.services.Crypt.decryptText(req.body.password);

    if (hashedPass !== userData.password.toString()) {
      service.User.LoginFailed(req.body.email, true);
      throw createHttpError(401, 'Wrong email/password');
    }

    const twoFactorEnabled = userData.secret_2FA && userData.secret_2FA.length > 0;
    if (twoFactorEnabled) {
      const tfaResult = speakeasy.totp.verifyDelta({
        secret: userData.secret_2FA,
        token: req.body.tfa,
        encoding: 'base32',
        window: 2,
      });

      if (!tfaResult) {
        throw createHttpError(401, 'Wrong 2-factor auth code');
      }
    }

    const internxtClient = req.headers['internxt-client'];
    const token = Sign(userData.email, App.config.get('secrets').JWT, internxtClient === 'drive-web');
    const newToken = Sign({ payload: {
      uuid: userData.uuid,
      email: userData.email,
      name: userData.name,
      lastname: userData.lastname,
      username: userData.username,
      sharedWorkspace: true,
      networkCredentials: {
        user: userData.bridgeUser,
        pass: userData.userId
      }
    } }, App.config.get('secrets').JWT);

    service.User.LoginFailed(req.body.email, false);
    service.User.UpdateAccountActivity(req.body.email);

    const userBucket = await service.User.GetUserBucket(userData);
    const keyExists = await service.KeyServer.keysExists(userData);

    if (!keyExists && req.body.publicKey) {
      await service.KeyServer.addKeysLogin(userData, req.body.publicKey, req.body.privateKey, req.body.revocateKey);
    }

    const keys = await service.KeyServer.getKeys(userData);
    const hasTeams = !!(await service.Team.getTeamByMember(req.body.email));
    const appSumoDetails = await service.AppSumo.GetDetails(userData.id).catch(() => null);

    const user = {
      email: req.body.email,
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
    };

    const userTeam = null;
    // TODO: Not working. Team members can not use team workspace due to this
    // if (userTeam) {
    //   const tokenTeam = Sign(userTeam.bridge_user, App.config.get('secrets').JWT, internxtClient === 'drive-web');

    //   return res.status(200).json({
    //     user, token, userTeam, tokenTeam
    //   });
    // }
    return res.status(200).json({ user, token, userTeam, newToken });
  });

  router.get('/user/refresh', passportAuth, async (req, res) => {
    const { publicKey, privateKey, revocateKey } = req.body;
    const userData: any = (req as AuthorizedUser).user;

    const keyExists = await service.KeyServer.keysExists(userData);

    if (!keyExists && publicKey) {
      await service.KeyServer.addKeysLogin(userData, publicKey, privateKey, revocateKey);
    }

    const keys = await service.KeyServer.getKeys(userData);
    const userBucket = await service.User.GetUserBucket(userData);

    const internxtClient = req.headers['internxt-client'];
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
    };

    res.status(200).json({ user, token });
  });

  router.post('/initialize', async (req, res) => {
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

    try {
      (await service.Folder.Create(userData, 'Family', user.root_folder_id)).save();
      (await service.Folder.Create(userData, 'Personal', user.root_folder_id)).save();
    } catch (err) {
      Logger.error(
        '[/initialize]: ERROR initializing welcome folders for user %s: %s',
        userData.email,
        (err as Error).message,
      );
    } finally {
      res.status(200).send({ user });
    }
  });

  return router;
};
