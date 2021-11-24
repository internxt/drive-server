import { Router, Request, Response } from 'express';

import { UserAttributes } from '../models/user';
import { passportAuth } from '../middleware/passport';
import Logger from '../../lib/logger';
import * as AnalyticsService from '../../lib/analytics/AnalyticsService';

const logger = Logger.getInstance();

type AuthorizedRequest = Request & { user: UserAttributes };

class ActivationController {
  private service: any;

  constructor (service: any) {
    this.service = service;
  }

  async deactivate(req: Request, res: Response) {
    const { email } = (req as AuthorizedRequest).user;

    await this.service.User.DeactivateUser(email);

    res.status(200).send({ error: null, message: 'User deactivated' });

    logger.info('[/deactivate]: User %s deactivated', email);

    AnalyticsService.trackDeactivationRequest(req as AuthorizedRequest);
  }

  async confirmDeactivation(req: Request, res: Response) {
    if (!req.params.token) {
      return res.status(400).send({ message: 'Missing token param' });
    }

    const { token } = req.params;

    await this.service.User.ConfirmDeactivateUser(token);

    res.status(200).send((req as (Request & { data: any })).data);

    logger.info('[/confirmDeactivation]: Token %s used for deactivation', token);
  }
}

export default (router: Router, service: any) => {
  const controller = new ActivationController(service);

  router.get('/deactivate', passportAuth, controller.deactivate.bind(controller));
  router.get('/confirmDeactivation/:token', controller.confirmDeactivation.bind(controller));
};
