import { Router, Request, Response } from 'express';
import createHttpError from 'http-errors';
import speakeasy from 'speakeasy';
import { UserAttributes } from '../models/user';
import { passportAuth, Sign } from '../middleware/passport';
import Config from '../../config/config';
import { AuthorizedUser } from './types';
import { HttpError } from 'http-errors';
import Logger from '../../lib/logger';
import winston from 'winston';
import { ReferralsNotAvailableError } from '../services/errors/referrals';

interface Services {
  User: any;
  Analytics: any;
  ReCaptcha: any;
  Crypt: any;
  KeyServer: any;
  Team: any;
  AppSumo: any;
  UsersReferrals: any;
  Newsletter: any;
}

export class AuthController {
  private service: Services;
  private config: Config;
  private logger: winston.Logger;

  constructor(service: Services, config: Config) {
    this.service = service;
    this.config = config;
    this.logger = Logger.getInstance();
  }

  async register(req: Request<{ email: string }>, res: Response) {
    // if (req.headers['internxt-client'] !== 'drive-mobile') {
    //   const ipaddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
    //   await this.service.ReCaptcha.verify(req.body.captcha, ipaddress);
    // }
    try {
      const result = await this.service.User.RegisterUser(req.body);

      res.status(200).send(result);
      await this.service.Newsletter.subscribe(result.user.email);
      this.service.Analytics.trackSignUp(req, result.user).catch(() => null);
    } catch (err: any) {
      if (err instanceof HttpError) {
        return res.status(err.status).send({
          error: err.message,
        });
      }

      this.logger.error(
        `[AUTH/REGISTER] ERROR: ${(err as Error).message}, BODY ${JSON.stringify(req.body)}, STACK: ${
          (err as Error).stack
        }`,
      );

      res.sendStatus(500);
    }
  }

  async login(req: Request, res: Response) {
    const internxtClient = req.headers['internxt-client'];

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
      user = await this.service.User.FindUserByEmail(req.body.email);
    } catch {
      throw createHttpError(401, 'Wrong login credentials');
    }

    const encSalt = this.service.Crypt.encryptText(user.hKey.toString());
    const required2FA = user.secret_2FA && user.secret_2FA.length > 0;

    const hasKeys = await this.service.KeyServer.keysExists(user);

    // TODO: If user has referrals, then apply. Do not catch everything
    if (internxtClient === 'drive-mobile') {
      this.service.UsersReferrals.applyUserReferral(user.id, 'install-mobile-app').catch((err: Error) => {
        this.logReferralError(user.id, err);
      });
    }

    if (internxtClient === 'drive-desktop') {
      this.service.UsersReferrals.applyUserReferral(user.id, 'install-desktop-app').catch((err: Error) => {
        this.logReferralError(user.id, err);
      });
    }

    res.status(200).send({ hasKeys, sKey: encSalt, tfa: required2FA });
  }

  private logReferralError(userId: unknown, err: Error) {
    if (!err.message) {
      return this.logger.error('[STORAGE]: ERROR message undefined applying referral for user %s', userId);
    }

    if (err instanceof ReferralsNotAvailableError) {
      return;
    }

    return this.logger.error('[STORAGE]: ERROR applying referral for user %s: %s', userId, err.message);
  }

  async access(req: Request, res: Response) {
    const MAX_LOGIN_FAIL_ATTEMPTS = 10;

    const userData: any = await this.service.User.FindUserByEmail(req.body.email).catch(() => {
      this.logger.info('[AUTH/LOGIN] Attempted login with a non-existing email: %s', req.body.email);
      throw createHttpError(401, 'Wrong login credentials');
    });

    const loginAttemptsLimitReached = userData.errorLoginCount >= MAX_LOGIN_FAIL_ATTEMPTS;

    if (loginAttemptsLimitReached) {
      throw createHttpError(401, 'Your account has been blocked for security reasons. Please reach out to us');
    }

    const hashedPass = this.service.Crypt.decryptText(req.body.password);

    if (hashedPass !== userData.password.toString()) {
      this.service.User.LoginFailed(req.body.email, true);
      throw createHttpError(401, 'Wrong login credentials');
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

    const token = Sign(userData.email, this.config.get('secrets').JWT, true);
    this.service.User.LoginFailed(req.body.email, false);

    this.service.User.UpdateAccountActivity(req.body.email);
    const userBucket = await this.service.User.GetUserBucket(userData);

    const newToken = Sign(this.getNewTokenPayload(userData), this.config.get('secrets').JWT);
    const keyExists = await this.service.KeyServer.keysExists(userData);

    if (!keyExists && req.body.publicKey) {
      await this.service.KeyServer.addKeysLogin(
        userData,
        req.body.publicKey,
        req.body.privateKey,
        req.body.revocateKey,
      );
    }

    const keys = await this.service.KeyServer.getKeys(userData);
    const hasTeams = !!(await this.service.Team.getTeamByMember(req.body.email));
    const appSumoDetails = await this.service.AppSumo.GetDetails(userData.id).catch(() => null);

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
      hasReferralsProgram: await this.service.UsersReferrals.hasReferralsProgram(
        userData.id,
        userData.email,
        userData.bridgeUser,
        userData.userId,
      ),
      backupsBucket: userData.backupsBucket,
      avatar: userData.avatar ? await this.service.User.getSignedAvatarUrl(userData.avatar) : null,
      emailVerified: userData.emailVerified,
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
  }

  async getNewToken(req: Request, res: Response) {
    const authRequest = req as Request & { user: UserAttributes };
    const newToken = Sign(this.getNewTokenPayload(authRequest.user), this.config.get('secrets').JWT);

    return res.status(200).json({ newToken });
  }

  private getNewTokenPayload(userData: any) {
    return {
      payload: {
        uuid: userData.uuid,
        email: userData.email,
        name: userData.name,
        lastname: userData.lastname,
        username: userData.username,
        sharedWorkspace: true,
        networkCredentials: {
          user: userData.bridgeUser,
          pass: userData.userId,
        },
      },
    };
  }

  async areCredentialsCorrect(req: Request, res: Response) {
    if (!req.query.hashedPassword) throw createHttpError(400, 'Query params must contain the hashedPassword property');

    const { hashedPassword } = req.query;
    const email = (req as AuthorizedUser).user.email;

    try {
      const user: UserAttributes = await this.service.User.FindUserByEmail(email);
      if (user.password.toString() !== hashedPassword) throw new Error('Passwords are not the same');

      return res.status(200).end();
    } catch (err) {
      throw createHttpError(401, 'Wrong credentials');
    }
  }
}

export default (router: Router, service: any, config: Config) => {
  const controller = new AuthController(service, config);
  const logger = Logger.getInstance();

  router.post('/register', controller.register.bind(controller));
  router.post('/login', controller.login.bind(controller));
  router.post('/access', async (req, res) => {
    try {
      await controller.access(req, res);
    } catch (err) {
      logger.error(`[AUTH/ACCESS]: ERROR for user ${req.body.email}: ${(err as Error).message}`);
      if (err instanceof HttpError) {
        return res.status(err.statusCode).send({ error: err.message, code: err.code });
      }

      res.status(500).send({ error: 'Internal Server Error' });
    }
  });
  router.get('/new-token', passportAuth, controller.getNewToken.bind(controller));
  router.get('/are-credentials-correct', passportAuth, controller.areCredentialsCorrect.bind(controller));
};
