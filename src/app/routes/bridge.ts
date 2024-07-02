import { Router, Request, Response } from 'express';

import { passportAuth } from '../middleware/passport';
import { UserAttributes } from '../models/user';

type AuthorizedRequest = Request & { user: UserAttributes };

class BridgeController {
  private service: any;

  constructor(service: any) {
    this.service = service;
  }

  async getUsage(req: Request, res: Response) {
    const usage = await this.service.User.getUsage((req as AuthorizedRequest).user);

    res.status(200).send(usage);
  }

  async getLimit(req: Request, res: Response) {
    const { 
      bridgeUser, 
      userId: bridgePass,
      updatedAt,
      uuid
    } = (req as AuthorizedRequest).user;

    const limit = await this.service.Limit.getLimit(
      bridgeUser, 
      bridgePass,
      uuid, 
      updatedAt
    );

    res.status(200).send(limit);
  }
}

export default (router: Router, service: any) => {
  const controller = new BridgeController(service);

  router.get('/usage', passportAuth, controller.getUsage.bind(controller));
  router.get('/limit', passportAuth, controller.getLimit.bind(controller));
};
