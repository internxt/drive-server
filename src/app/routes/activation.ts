import { Router, Request } from 'express';

import { UserAttributes } from '../models/user';
import { passportAuth } from '../middleware/passport';
import Logger from '../../lib/logger';
import * as AnalyticsService from '../../lib/analytics/AnalyticsService';

type AuthorizedRequest = Request & { user: UserAttributes };

const logger = Logger.getInstance();

export default (router: Router, service: any) => {
  router.get('/deactivate', passportAuth, async (req: Request, res) => {
    const { email } = (req as AuthorizedRequest).user;

    await service.User.DeactivateUser(email);

    res.status(200).send({ error: null, message: 'User deactivated' });

    logger.info('[/deactivate]: User %s deactivated', email);

    AnalyticsService.trackDeactivationRequest(req as AuthorizedRequest);
  });

  router.get('/confirmDeactivation/:token', async (req: Request, res) => {
    const { token } = req.params;

    await service.User.ConfirmDeactivateUser(token);

    res.status(200).send((req as (Request & { data: any })).data);

    logger.info('[/confirmDeactivation]: Token %s used for deactivation', token);
  });
};
