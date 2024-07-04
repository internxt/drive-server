import { Router, Request, Response } from 'express';

import { passportAuth } from '../middleware/passport';
import { UserAttributes } from '../models/user';
import createHttpError from 'http-errors';

type AuthorizedRequest = Request & { user: UserAttributes };

class BridgeController {
  private service: any;

  constructor(service: any) {
    this.service = service;
  }

  async getUsage(req: Request, res: Response) {
    let user = (req as AuthorizedRequest).user;
    const { workspaceUserId } = req.query;

    if (workspaceUserId) {
      user = await this.service.User.FindUserByUuid(workspaceUserId).catch(() => {
        throw createHttpError(404, 'WorkspaceUser not found');
      });
    }

    const usage = await this.service.User.getUsage(user);

    res.status(200).send(usage);
  }

  async getLimit(req: Request, res: Response) {
    let { 
      bridgeUser, 
      userId: bridgePass,
      updatedAt,
      uuid
    } = (req as AuthorizedRequest).user;

    const { workspaceUserId } = req.query;

    if (workspaceUserId) {
      const workspaceUser = await this.service.User.FindUserByUuid(workspaceUserId).catch(() => {
        throw createHttpError(404, 'WorkspaceUser not found');
      });

      bridgeUser = workspaceUser.username;
      bridgePass = workspaceUser.userId;
      uuid = workspaceUser.uuid;
      updatedAt = workspaceUser.updatedAt;
    }

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
