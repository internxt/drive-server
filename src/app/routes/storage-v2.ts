import { Request, Response, Router } from 'express';
import sharedMiddlewareBuilder from '../middleware/shared-workspace';
import passport from '../middleware/passport';
import { UserAttributes } from '../models/user';
import { Logger } from 'winston';
import { default as logger } from '../../lib/logger';
import { ReferralsNotAvailableError } from '../services/errors/referrals';
import createHttpError from 'http-errors';
import { FolderAttributes } from '../models/folder';

interface Services {
  Files: any
  Folder: any
  UsersReferrals: any
  Analytics: any
  User: any
  Notifications: any
}

type SharedRequest = Request & { behalfUser: UserAttributes };
type PassportRequest = Request & { user: UserAttributes };

export class StorageController {
  private services: Services;
  private logger: Logger;

  constructor(services: Services, logger: Logger) {
    this.services = services;
    this.logger = logger;
  }

  async createFile(req: Request, res: Response) {
    const { behalfUser } = req as SharedRequest;
    const { file } = req.body;
    const internxtClient = req.headers['internxt-client'];

    if (!req.headers['internxt-client-id']) {
      throw createHttpError(400, 'Missing header internxt-client-id');
    }

    const clientId = String(req.headers['internxt-client-id']);

    if (!file.fileId && file.file_id) {
      // TODO : Remove WHEN every project uses the SDK
      file.fileId = file.file_id;
    }

    if (!file || !file.fileId || !file.bucket || !file.size || !file.folder_id || !file.name) {
      this.logger.error(
        `Invalid metadata trying to create a file for user ${behalfUser.email}: ${JSON.stringify(file, null, 2)}`
      );
      return res.status(400).json({ error: 'Invalid metadata for new file' });
    }

    const result = await this.services.Files.CreateFile(behalfUser, file);

    // TODO: If user has referrals, then apply. Do not catch everything
    if (internxtClient === 'drive-mobile') {
      this.services.UsersReferrals.applyUserReferral(behalfUser.id, 'install-mobile-app')
        .catch((err: Error) => {
          this.logReferralError(behalfUser.id, err);
        });
    }

    if (internxtClient === 'drive-desktop') {
      this.services.UsersReferrals.applyUserReferral(behalfUser.id, 'install-desktop-app')
        .catch((err: Error) => {
          this.logReferralError(behalfUser.id, err);
        });
    }

    res.status(200).json(result);

    const workspaceMembers = await this.services.User.findWorkspaceMembers(behalfUser.bridgeUser);

    workspaceMembers.forEach(
      ({ email }: { email: string }) => void this.services.Notifications.fileCreated({
        file: result,
        email: email,
        clientId: clientId
      }),
    );

    this.services.Analytics.trackUploadCompleted(req, behalfUser);
  }

  createFolder(req: Request, res: Response): Promise<void> {
    const { folderName, parentFolderId } = req.body;
    const { user } = req as PassportRequest;

    if (typeof folderName !== 'string' || folderName.length === 0) {
      throw createHttpError(400, 'Folder name must be a valid string');
    }

    if (!parentFolderId || parentFolderId <= 0) {
      throw createHttpError(400, 'Parent folder ID is not valid');
    }

    if (!req.headers['internxt-client-id']) {
      throw createHttpError(400, 'Missing header internxt-client-id');
    }

    const clientId = String(req.headers['internxt-client-id']);

    return this.services.Folder.Create(user, folderName, parentFolderId)
      .then(async (result: FolderAttributes) => {
        res.status(201).json(result);
        const workspaceMembers = await this.services.User.findWorkspaceMembers(user.bridgeUser);
        workspaceMembers.forEach(
          ({ email }: { email: string }) => void this.services.Notifications.folderCreated({
            folder: result,
            email: email,
            clientId: clientId
          })
        );
      })
      .catch((err: Error) => {
        this.logger.warn(err);
        res.status(500).json({ error: err.message });
      });
  }

  logReferralError(userId: unknown, err: Error) {
    if (!err.message) {
      return this.logger.error('[STORAGE]: ERROR message undefined applying referral for user %s', userId);
    }

    if (err instanceof ReferralsNotAvailableError) {
      return;
    }

    return this.logger.error('[STORAGE]: ERROR applying referral for user %s: %s', userId, err.message);
  };
}

export default (router: Router, service: any) => {
  const Logger = logger.getInstance();
  const { passportAuth } = passport;
  const sharedAdapter = sharedMiddlewareBuilder.build(service);
  const controller = new StorageController(service, Logger);

  router.post('/storage/file', passportAuth, sharedAdapter, controller.createFile.bind(controller));
  router.post('/storage/folder', passportAuth, controller.createFolder.bind(controller));
};
