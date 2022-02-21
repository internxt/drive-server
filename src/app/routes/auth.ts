import { Router, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { UserAttributes } from '../models/user';

interface Services {
  User: any,
  Analytics: any,
  ReCaptcha: any,
  Crypt: any,
  KeyServer: any
}

export class AuthController {
  private service: Services;

  constructor(service: Services) {
    this.service = service;
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

}

export default (router: Router, service: any) => {
  const controller = new AuthController(service);

  router.post('/register', controller.register.bind(controller));
  router.post('/login', controller.login.bind(controller));
};
