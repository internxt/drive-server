import { Request, Router, Response } from 'express';
import { default as logger } from '../../lib/logger';
import { passportAuth } from '../middleware/passport';
import sharedMiddlewareBuilder from '../middleware/shared-workspace';
import { UserAttributes } from '../models/user';
import createHttpError from 'http-errors';
import Validator from '../../lib/Validator';
import { ReferralsNotAvailableError } from '../services/errors/referrals';
import { Logger } from 'winston';

type AuthorizedRequest = Request & { behalfUser: UserAttributes };

interface Services {
  Share: any
  UsersReferrals: any
  Analytics: any
}

export class ShareController {
  private services: Services;
  private logger: Logger;

  constructor(services: Services, logger: Logger) {
    this.services = services;
    this.logger = logger;
  }

  public async listShares(req: Request, res: Response) {
    const list = await this.services.Share.list((req as AuthorizedRequest).behalfUser);

    res.status(200).send(list);
  }

  public async getSharedFolderSize(req: Request<{ shareId: string, folderId: string }>, res: Response) {
    const { shareId, folderId } = req.params;
    const folderSize = await this.services.Share.getSharedFolderSize(shareId, folderId);

    res.status(200).send({ size: folderSize });
  }

  public async generateShareFileToken(req: Request, res: Response): Promise<void> {
    const { behalfUser: user } = req as AuthorizedRequest;
    const itemId = req.params.id;
    const { views, encryptionKey, fileToken, bucket } = req.body;

    if (Validator.isInvalidString(itemId)) {
      throw createHttpError(400, 'File ID must be a valid string');
    }

    if (isNaN(views) || views <= 0) {
      throw createHttpError(400, 'Views parameter not valid');
    }

    if (Validator.isInvalidString(encryptionKey)) {
      throw createHttpError(400, 'Encryption key must be a valid string');
    }

    if (Validator.isInvalidString(fileToken)) {
      throw createHttpError(400, 'File token must be a valid string');
    }

    if (Validator.isInvalidString(bucket)) {
      throw createHttpError(400, 'Bucket identifier must be a valid string');
    }

    const result = await this.services.Share.GenerateFileToken(
      user,
      itemId,
      '',
      bucket,
      encryptionKey,
      fileToken,
      false,
      views,
    );

    await this.services.UsersReferrals.applyUserReferral(user.id, 'share-file')
      .catch((err: Error) => {
        this.logReferralError(user.id, err);
      });

    res.status(200).send({ token: result });

    this.services.Analytics.trackShareLinkCopied(user.uuid, views, req);
  }

  private logReferralError(userId: unknown, err: Error) {
    if (!err.message) {
      return this.logger.error('[STORAGE]: ERROR message undefined applying referral for user %s', userId);
    }

    if (err instanceof ReferralsNotAvailableError) {
      return;
    }

    return this.logger.error('[STORAGE]: ERROR applying referral for user %s: %s', userId, err.message);
  };
}

export default (router: Router, service: any, ) => {
  const Logger = logger.getInstance();
  const controller = new ShareController(service, Logger);
  const sharedAdapter = sharedMiddlewareBuilder.build(service);

  router.get('/share/list', passportAuth, sharedAdapter, controller.listShares.bind(controller));
  router.get('/share/:shareId/folder/:folderId', controller.getSharedFolderSize.bind(controller));
  router.post('/storage/share/file/:id', passportAuth, sharedAdapter,
    controller.generateShareFileToken.bind(controller)
  );
};
