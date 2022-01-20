import { Router, Request, Response } from 'express';

import { UserAttributes } from '../models/user';
import { passportAuth } from '../middleware/passport';
import Logger from '../../lib/logger';
import * as AnalyticsService from '../../lib/analytics/AnalyticsService';

const logger = Logger.getInstance();

type AuthorizedRequest = Request & { user: UserAttributes };

class ActivationController {
  private service: any;

  constructor(service: any) {
    this.service = service;
  }

  async sendDeactivationEmail(req: Request<{ email: string }>, res: Response) {
    const email = req.params.email.toLowerCase();
    const user = await this.service.User.FindUserByEmail(email);
    const uuid = user.uuid;
    await this.service.User.deactivate(email);
    res.status(200).send({ error: null, message: 'Email sent' });
    logger.info('User %s requested deactivation', email);
    AnalyticsService.trackDeactivationRequest(uuid, req);
  }

  async deactivate(req: Request, res: Response) {
    const { email, uuid } = (req as AuthorizedRequest).user;

    await this.service.User.deactivate(email);

    res.status(200).send({ error: null, message: 'User deactivated' });

    logger.info('User %s requested deactivation', email);

    AnalyticsService.trackDeactivationRequest(uuid, req);
  }

  async sendResetEmail(req: Request<{ email: string }>, res: Response) {
    const email = req.params.email.toLowerCase();

    await this.service.User.deactivate(email);

    res.status(200).send();
  }

  async confirmDeactivation(req: Request, res: Response) {
    if (!req.params.token) {
      return res.status(400).send({ message: 'Missing token param' });
    }

    const { token } = req.params;

    await this.service.User.confirmDeactivate(token).catch((err: Error) => {
      if (err.message === 'User not found') {
        return;
      }
      throw err;
    });

    res.status(200).send((req as Request & { data: any }).data);

    // AnalyticsService.trackDeactivationConfirmed(user.uuid);
  }
}

export default (router: Router, service: any) => {
  const controller = new ActivationController(service);

  router.get('/deactivate/:email', controller.sendDeactivationEmail.bind(controller));
  router.get('/deactivate', passportAuth, controller.deactivate.bind(controller));
  router.get('/reset/:email', controller.sendResetEmail.bind(controller));
  router.get('/confirmDeactivation/:token', controller.confirmDeactivation.bind(controller));
};
