import { Router, Request, Response } from 'express';

interface Services {
  User: any,
  Analytics: any,
  ReCaptcha: any
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

}

export default (router: Router, service: any) => {
  const controller = new AuthController(service);

  router.post('/register', controller.register.bind(controller));
};
