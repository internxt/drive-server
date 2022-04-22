import { Router, Request, Response } from 'express';
import createHttpError from 'http-errors';
import speakeasy from 'speakeasy';
import { UserAttributes } from '../models/user';
import { passportAuth, Sign } from '../middleware/passport';
import Config from '../../config/config';

interface Services {
  User: any;
  Analytics: any;
  ReCaptcha: any;
  Crypt: any;
  KeyServer: any;
  Team: any;
  AppSumo: any;
  UsersReferrals: any;
}

export class AuthController {
  private service: Services;
  private config: Config;

  constructor(service: Services, config: Config) {
    this.service = service;
    this.config = config;
  }

  async register(req: Request<{ email: string }>, res: Response) {
    if (req.headers['internxt-client'] !== 'drive-mobile') {
      const ipaddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
      await this.service.ReCaptcha.verify(req.body.captcha, ipaddress);
    }

    const result = await this.service.User.RegisterUser(req.body);
    res.status(200).send(result);

    this.service.Analytics.trackSignUp(req, result.user);
  }

  async login(req: Request, res: Response) {
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
      throw createHttpError(401, 'Wrong email/password');
    }

    const encSalt = this.service.Crypt.encryptText(user.hKey.toString());
    const required2FA = user.secret_2FA && user.secret_2FA.length > 0;

    const hasKeys = await this.service.KeyServer.keysExists(user);

    res.status(200).send({ hasKeys, sKey: encSalt, tfa: required2FA });
  }

  async access(req: Request, res: Response) {
    const MAX_LOGIN_FAIL_ATTEMPTS = 10;

    const userData: any = await this.service.User.FindUserByEmail(req.body.email);

    if (!userData) {
      throw createHttpError(401, 'Wrong email/password');
    }

    const loginAttemptsLimitReached = userData.errorLoginCount >= MAX_LOGIN_FAIL_ATTEMPTS;

    if (loginAttemptsLimitReached) {
      throw createHttpError(401, 'Your account has been blocked for security reasons. Please reach out to us');
    }

    const hashedPass = this.service.Crypt.decryptText(req.body.password);

    if (hashedPass !== userData.password.toString()) {
      this.service.User.LoginFailed(req.body.email, true);
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
    const token = Sign(userData.email, this.config.get('secrets').JWT, internxtClient === 'drive-web');
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
}

export default (router: Router, service: any, config: Config) => {
  const controller = new AuthController(service, config);

  router.post('/register', controller.register.bind(controller));
  router.post('/login', controller.login.bind(controller));
  router.post('/access', controller.access.bind(controller));
  router.get('/new-token', passportAuth, controller.getNewToken.bind(controller));
};
