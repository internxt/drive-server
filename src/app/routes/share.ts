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
  Share: any;
  UsersReferrals: any;
  Analytics: any;
}

export class ShareController {
  private services: Services;
  private logger: Logger;

  constructor(services: Services, logger: Logger) {
    this.services = services;
    this.logger = logger;
  }

  public async listShares(req: Request, res: Response) {
    const { behalfUser } = req as AuthorizedRequest;
    const list = await this.services.Share.list(behalfUser);
    res.status(200).send(list);
  }

  public async getSharedFolderSize(req: Request<{ shareId: string; folderId: string }>, res: Response) {
    const { shareId, folderId } = req.params;

    if (Validator.isInvalidString(folderId)) {
      throw createHttpError(400, 'Folder ID is not valid');
    }

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

    await this.services.UsersReferrals.applyUserReferral(user.id, 'share-file').catch((err: Error) => {
      this.logReferralError(user.id, err);
    });

    res.status(200).send({ token: result });

    this.services.Analytics.trackShareLinkCopied(user.uuid, views, req);
  }

  public async generateShareFolderToken(req: Request, res: Response): Promise<void> {
    const { behalfUser: user } = req as AuthorizedRequest;
    const folderId = req.params.id;
    const { views, bucketToken, bucket, mnemonic } = req.body;

    if (Validator.isInvalidString(folderId)) {
      throw createHttpError(400, 'Folder ID must be a valid string');
    }

    if (Validator.isInvalidPositiveNumber(views)) {
      throw createHttpError(400, 'Views parameter not valid');
    }

    if (Validator.isInvalidString(bucketToken)) {
      throw createHttpError(400, 'Bucket token must be a valid string');
    }

    if (Validator.isInvalidString(mnemonic)) {
      throw createHttpError(400, 'Mnemonic must be a valid string');
    }

    if (Validator.isInvalidString(bucket)) {
      throw createHttpError(400, 'Bucket identifier must be a valid string');
    }
    const token = await this.services.Share.GenerateFolderToken(user, folderId, bucket, mnemonic, bucketToken, views);

    res.status(200).send({
      token: token,
    });

    this.services.Analytics.trackShareLinkCopied(user.uuid, views, req);
  }

  public async getShareFileInfo(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    if (Validator.isInvalidString(token)) {
      throw createHttpError(400, 'Token must be a valid string');
    }

    return this.services.Share.getFileInfo(token)
      .then((share: unknown) => {
        res.status(200).json(share);
        this.services.Analytics.trackSharedLink(req, share);
      })
      .catch((err: Error) => {
        res.status(500).send({
          error: err.message,
        });
      });
  }

  public async getShareFolderInfo(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    if (Validator.isInvalidString(token)) {
      throw createHttpError(400, 'Token must be a valid string');
    }

    return this.services.Share.getFolderInfo(token)
      .then((info: unknown) => {
        res.status(200).json(info);
      })
      .catch((err: Error) => {
        res.status(500).send({
          error: err.message,
        });
      });
  }

  public async getSharedDirectoryFiles(req: Request, res: Response): Promise<void> {
    const { token, code, directoryId, offset, limit } = req.query;

    if (Validator.isInvalidString(token)) {
      throw createHttpError(400, 'Token must be a valid string');
    }

    if (Validator.isInvalidString(code)) {
      throw createHttpError(400, 'Code must be a valid string');
    }

    if (Validator.isInvalidPositiveNumber(directoryId)) {
      throw createHttpError(400, 'Directory ID is not valid');
    }

    if (Validator.isInvalidUnsignedNumber(offset)) {
      throw createHttpError(400, 'Offset is not valid');
    }

    if (Validator.isInvalidPositiveNumber(limit)) {
      throw createHttpError(400, 'Limit is not valid');
    }

    return this.services.Share.getSharedDirectoryFiles(directoryId, Number(offset), Number(limit), token, code)
      .then((results: unknown) => {
        res.status(200).json(results);
      })
      .catch((err: Error) => {
        res.status(500).json({
          error: err.message,
        });
      });
  }

  public async getSharedDirectoryFolders(req: Request, res: Response): Promise<void> {
    const { token, directoryId, offset, limit } = req.query;

    if (Validator.isInvalidString(token)) {
      throw createHttpError(400, 'Token must be a valid string');
    }

    if (Validator.isInvalidPositiveNumber(directoryId)) {
      throw createHttpError(400, 'Directory ID is not valid');
    }

    if (Validator.isInvalidUnsignedNumber(offset)) {
      throw createHttpError(400, 'Offset is not valid');
    }

    if (Validator.isInvalidPositiveNumber(limit)) {
      throw createHttpError(400, 'Limit is not valid');
    }

    return this.services.Share.getSharedDirectoryFolders(directoryId, Number(offset), Number(limit), token)
      .then((results: { folders: unknown[], last: boolean }) => {
        res.status(200).json(results);
      })
      .catch((err: Error) => {
        if (err.message === 'Forbidden') {
          return res.status(403).send({ error: err.message });
        }

        res.status(500).json({
          error: err.message,
        });
      });
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
}

export default (router: Router, service: any) => {
  const Logger = logger.getInstance();
  const controller = new ShareController(service, Logger);
  const sharedAdapter = sharedMiddlewareBuilder.build(service);

  router.get('/share/list', passportAuth, sharedAdapter, controller.listShares.bind(controller));
  router.get('/share/:shareId/folder/:folderId', controller.getSharedFolderSize.bind(controller));
  router.post(
    '/storage/share/file/:id',
    passportAuth,
    sharedAdapter,
    controller.generateShareFileToken.bind(controller),
  );
  router.post(
    '/storage/share/folder/:id',
    passportAuth,
    sharedAdapter,
    controller.generateShareFolderToken.bind(controller),
  );
  router.get('/storage/share/:token', controller.getShareFileInfo.bind(controller));
  router.get('/storage/shared-folder/:token', controller.getShareFolderInfo.bind(controller));
  router.get('/storage/share/down/files', controller.getSharedDirectoryFiles.bind(controller));
  router.get('/storage/share/down/folders', controller.getSharedDirectoryFolders.bind(controller));
};
