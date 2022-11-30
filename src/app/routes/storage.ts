import { Request, Response, Router } from 'express';
import sharedMiddlewareBuilder from '../middleware/shared-workspace';
import passport from '../middleware/passport';
import { UserAttributes } from '../models/user';
import { Logger } from 'winston';
import { default as logger } from '../../lib/logger';
import createHttpError, { HttpError } from 'http-errors';
import { FolderAttributes } from '../models/folder';
import teamsMiddlewareBuilder from '../middleware/teams';
import Validator from '../../lib/Validator';
import { FileAttributes } from '../models/file';
import CONSTANTS from '../constants';
import { LockNotAvaliableError } from '../services/errors/locks';
import { ConnectionTimedOutError } from 'sequelize/types';

type AuthorizedRequest = Request & { user: UserAttributes };
interface Services {
  Files: any;
  Thumbnails: any;
  Folder: any;
  UsersReferrals: any;
  Analytics: any;
  User: any;
  Notifications: any;
  Share: any;
  Crypt: any;
  Inxt: any;
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

  public async createFile(req: Request, res: Response) {
    const { behalfUser } = req as SharedRequest;
    const { file } = req.body;
    const internxtClient = req.headers['internxt-client'];
    const clientId = String(req.headers['internxt-client-id']);

    if (!file.fileId && file.file_id) {
      // TODO : Remove WHEN every project uses the SDK
      file.fileId = file.file_id;
    }

    if (!file || !file.fileId || !file.bucket || !file.size || !file.folder_id || !file.name) {
      this.logger.error(
        `Invalid metadata trying to create a file for user ${behalfUser.email}: ${JSON.stringify(file, null, 2)}`,
      );
      return res.status(400).json({ error: 'Invalid metadata for new file' });
    }

    const result = await this.services.Files.CreateFile(behalfUser, file);

    res.status(200).json(result);

    const workspaceMembers = await this.services.User.findWorkspaceMembers(behalfUser.bridgeUser);

    workspaceMembers.forEach(
      ({ email }: { email: string }) =>
        void this.services.Notifications.fileCreated({
          file: result,
          email: email,
          clientId: clientId,
        }),
    );

    this.services.Analytics.trackUploadCompleted(req, behalfUser);
  }

  public async createFolder(req: Request, res: Response): Promise<void> {
    const { folderName, parentFolderId } = req.body;
    const { user } = req as PassportRequest;

    if (Validator.isInvalidString(folderName)) {
      throw createHttpError(400, 'Folder name must be a valid string');
    }

    if (!parentFolderId || parentFolderId <= 0) {
      throw createHttpError(400, 'Parent folder ID is not valid');
    }

    const clientId = String(req.headers['internxt-client-id']);

    const parentFolder = await this.services.Folder.getById(parentFolderId);

    if (parentFolder.userId !== user.id) {
      throw createHttpError(403, 'Parent folder does not belong to user');
    }

    return this.services.Folder.Create(user, folderName, parentFolderId)
      .then(async (result: FolderAttributes) => {
        res.status(201).json(result);
        const workspaceMembers = await this.services.User.findWorkspaceMembers(user.bridgeUser);
        workspaceMembers.forEach(
          ({ email }: { email: string }) =>
            void this.services.Notifications.folderCreated({
              folder: result,
              email: email,
              clientId: clientId,
            }),
        );
      })
      .catch((err: Error) => {
        this.logger.error(`Error creating folder for user ${user.id}: ${err}`);
        res.status(500).send();
      });
  }

  public async getTree(req: Request, res: Response): Promise<void> {
    const { user } = req as PassportRequest;
    const deleted = req.query?.trash === 'true';

    return this.services.Folder.GetTree(user, user.rootFolderId, deleted)
      .then((result: unknown) => {
        res.status(200).send(result);
      })
      .catch((err: Error) => {
        res.status(500).send({
          error: err.message,
        });
      });
  }

  public async getTreeSpecific(req: Request, res: Response): Promise<void> {
    const { user } = req as PassportRequest;
    const { folderId } = req.params;

    if (Validator.isInvalidPositiveNumber(folderId)) {
      throw createHttpError(400, 'Folder ID not valid');
    }

    return this.services.Folder.GetTree(user, folderId)
      .then((result: unknown) => {
        const treeSize = this.services.Folder.GetTreeSize(result);
        res.status(200).send({
          tree: result,
          size: treeSize,
        });
      })
      .catch((err: Error) => {
        this.logger.error(`Error getting specific tree for user ${user.id}: ${err}`);
        res.status(500).send();
      });
  }

  public async deleteFolder(req: Request, res: Response): Promise<void> {
    const { behalfUser: user } = req as SharedRequest;

    const folderId = Number(req.params.id);
    if (Validator.isInvalidPositiveNumber(folderId)) {
      throw createHttpError(400, 'Folder ID param is not valid');
    }

    const clientId = String(req.headers['internxt-client-id']);

    return this.services.Folder.Delete(user, folderId)
      .then(async (result: unknown) => {
        res.status(204).send(result);
        const workspaceMembers = await this.services.User.findWorkspaceMembers(user.bridgeUser);
        workspaceMembers.forEach(
          ({ email }: { email: string }) =>
            void this.services.Notifications.folderDeleted({
              id: folderId,
              email: email,
              clientId: clientId,
            }),
        );
      })
      .catch((err: Error) => {
        this.logger.error(`${err.message}\n${err.stack}`);
        res.status(500).send();
      });
  }

  public async moveFolder(req: Request, res: Response): Promise<void> {
    const { behalfUser: user } = req as SharedRequest;
    const { folderId, destination } = req.body;

    if (Validator.isInvalidPositiveNumber(folderId)) {
      throw createHttpError(400, 'Folder ID is not valid');
    }

    if (Validator.isInvalidPositiveNumber(destination)) {
      throw createHttpError(400, 'Destination folder ID is not valid');
    }

    if (folderId === destination) {
      throw createHttpError(409, 'Cannot move folder into itself');
    }

    const clientId = String(req.headers['internxt-client-id']);

    return this.services.Folder.MoveFolder(user, folderId, destination)
      .then(async (result: { result: FolderAttributes }) => {
        res.status(200).json(result);
        const workspaceMembers = await this.services.User.findWorkspaceMembers(user.bridgeUser);
        workspaceMembers.forEach(
          ({ email }: { email: string }) =>
            void this.services.Notifications.folderUpdated({
              folder: result.result,
              email: email,
              clientId: clientId,
            }),
        );
      })
      .catch((err: Error) => {
        if (err instanceof HttpError) {
          res.status(err.status).json({
            error: err.message,
          });
        }
        res.sendStatus(500);
      });
  }

  public async updateFolder(req: Request, res: Response): Promise<void> {
    const { behalfUser: user } = req as SharedRequest;
    const folderId = req.params.folderid;
    const { metadata } = req.body;

    if (Validator.isInvalidPositiveNumber(folderId)) {
      throw createHttpError(400, 'Folder ID is not valid');
    }

    const clientId = String(req.headers['internxt-client-id']);

    return this.services.Folder.UpdateMetadata(user, folderId, metadata)
      .then(async (result: FolderAttributes) => {
        res.status(200).json(result);
        const workspaceMembers = await this.services.User.findWorkspaceMembers(user.bridgeUser);
        workspaceMembers.forEach(
          ({ email }: { email: string }) =>
            void this.services.Notifications.folderUpdated({
              folder: result,
              email: email,
              clientId: clientId,
            }),
        );
      })
      .catch((err: Error) => {
        this.logger.error(`Error updating metadata from folder ${folderId}: ${err}`);
        res.status(500).send();
      });
  }

  public async getFolderContents(req: Request, res: Response): Promise<void> {
    const { behalfUser } = req as SharedRequest;
    const { id } = req.params;
    const deleted = req.query?.trash === 'true';

    if (Validator.isInvalidPositiveNumber(id)) {
      throw createHttpError(400, 'Folder ID is not valid');
    }

    await Promise.all([
      this.services.Folder.getByIdAndUserIds(
        id, 
        [
          behalfUser.id,
          (req as AuthorizedRequest).user.id
        ]
      ),
      this.services.Folder.getFolders(id, behalfUser.id, deleted),
      this.services.Files.getByFolderAndUserId(id, behalfUser.id, deleted),
    ])
      .then(([currentFolder, childrenFolders, childrenFiles]) => {
        if (!currentFolder || !childrenFolders || !childrenFiles) {
          res.status(400).send();
        }

        res.status(200).json({
          ...currentFolder,
          children: childrenFolders,
          files: childrenFiles,
        });
      })
      .catch((err) => {
        if (err.message === 'Folder not found') {
          return res.status(404).send({ error: err.message });
        }

        if (err.message === 'Folder not owned') {
          return res.status(403).send({ error: err.message });
        }

        this.logger.error(`Error getting folder contents, folderId: ${id}: ${err}. Stack: ${err.stack}`);

        if (err instanceof ConnectionTimedOutError) {
          res.status(504).send();
        }

        res.status(500).send();
      });
  }

  public async getFolderSize(req: Request, res: Response): Promise<void> {
    const { user } = req as PassportRequest;
    const folderId = req.params.id;

    if (Validator.isInvalidPositiveNumber(folderId)) {
      throw createHttpError(400, 'Folder ID is not valid');
    }

    const size = await this.services.Share.getFolderSize(folderId, user.id);

    res.status(200).json({
      size: size,
    });
  }

  public async moveFile(req: Request, res: Response): Promise<void> {
    const { behalfUser: user } = req as SharedRequest;
    const { fileId, destination } = req.body;

    if (Validator.isInvalidString(fileId)) {
      throw createHttpError(400, 'File ID is not valid');
    }

    if (Validator.isInvalidPositiveNumber(destination)) {
      throw createHttpError(400, 'Destination folder ID is not valid');
    }

    const clientId = String(req.headers['internxt-client-id']);

    return this.services.Files.MoveFile(user, fileId, destination)
      .then(async (result: { result: FileAttributes }) => {
        res.status(200).json(result);
        const workspaceMembers = await this.services.User.findWorkspaceMembers(user.bridgeUser);
        workspaceMembers.forEach(
          ({ email }: { email: string }) =>
            void this.services.Notifications.fileUpdated({
              file: result.result,
              email: email,
              clientId: clientId,
            }),
        );
      })
      .catch((err: Error) => {
        this.logger.error(err);
        if (err instanceof HttpError) {
          res.status(err.status).json({
            error: err.message,
          });
        }
        res.sendStatus(500);
      });
  }

  public async updateFile(req: Request, res: Response): Promise<void> {
    const { behalfUser: user } = req as SharedRequest;
    const fileId = req.params.fileid;
    const { metadata, bucketId, relativePath } = req.body;
    const mnemonic = req.headers['internxt-mnemonic'];
    const clientId = String(req.headers['internxt-client-id']);

    if (Validator.isInvalidString(fileId)) {
      throw createHttpError(400, 'File ID is not valid');
    }

    if (Validator.isInvalidString(bucketId)) {
      throw createHttpError(400, 'Bucket ID is not valid');
    }

    if (Validator.isInvalidString(relativePath)) {
      throw createHttpError(400, 'Relative path is not valid');
    }

    if (Validator.isInvalidString(mnemonic)) {
      throw createHttpError(400, 'Mnemonic is not valid');
    }

    return this.services.Files.UpdateMetadata(user, fileId, metadata, mnemonic, bucketId, relativePath)
      .then(async (result: FileAttributes) => {
        res.status(200).json(result);
        const workspaceMembers = await this.services.User.findWorkspaceMembers(user.bridgeUser);
        workspaceMembers.forEach(
          ({ email }: { email: string }) =>
            void this.services.Notifications.fileUpdated({
              file: result,
              email,
              clientId,
            }),
        );
      })
      .catch((err: Error) => {
        this.logger.error(`Error updating metadata from file ${fileId} : ${err}`);
        res.status(500).send();
      });
  }

  public async deleteFileBridge(req: Request, res: Response): Promise<void> {
    if (req.params.bucketid === 'null') {
      // Weird checking...
      res.status(500).json({ error: 'No bucket ID provided' });
      return;
    }

    if (req.params.fileid === 'null') {
      res.status(500).json({ error: 'No file ID provided' });
      return;
    }

    const { user } = req as PassportRequest;
    const bucketId = req.params.bucketid;
    const fileIdInBucket = req.params.fileid;

    return this.services.Files.Delete(user, bucketId, fileIdInBucket)
      .then(() => {
        res.status(200).json({
          deleted: true,
        });
      })
      .catch((err: Error) => {
        this.logger.error(err.stack);
        res.status(500).json({
          error: err.message,
        });
      });
  }

  public async deleteFileDatabase(req: Request, res: Response): Promise<void> {
    const { behalfUser: user } = req as SharedRequest;
    const { folderid, fileid } = req.params;
    const clientId = String(req.headers['internxt-client-id']);

    if (Validator.isInvalidPositiveNumber(fileid)) {
      throw createHttpError(400, 'File ID is not valid');
    }

    if (Validator.isInvalidPositiveNumber(folderid)) {
      throw createHttpError(400, 'Folder ID is not valid');
    }

    return this.services.Files.DeleteFile(user, folderid, fileid)
      .then(async () => {
        res.status(200).json({ deleted: true });
        const workspaceMembers = await this.services.User.findWorkspaceMembers(user.bridgeUser);
        workspaceMembers.forEach(
          ({ email }: { email: string }) =>
            void this.services.Notifications.fileDeleted({
              id: Number(fileid),
              email,
              clientId,
            }),
        );

        this.services.Analytics.trackFileDeleted(req);
      })
      .catch((err: Error) => {
        res.status(500).json({ error: err.message });
      });
  }

  public async getRecentFiles(req: Request, res: Response): Promise<void> {
    const { behalfUser } = req as SharedRequest;
    const { user } = req as PassportRequest;
    const { limit } = req.query;

    // Mobile is not sending the limit
    const validLimit = Math.min(parseInt(limit as string), CONSTANTS.RECENTS_LIMIT) || CONSTANTS.RECENTS_LIMIT;

    return this.services.Files.getRecentFiles(behalfUser, validLimit)
      .then((files: FileAttributes[]) => {
        if (!files) {
          return res.status(404).send({ error: 'Files not found' });
        }
        return res.status(200).json(files);
      })
      .catch((err: Error) => {
        this.logger.error(`Can not get recent files: ${user.email} : ${err.message}`);
        res.status(500).send({ error: 'Can not get recent files' });
      });
  }

  public async acquireFolderLock(req: Request, res: Response): Promise<void> {
    const { user } = req as PassportRequest;
    const { folderId, lockId } = req.params;

    if (Validator.isInvalidPositiveNumber(folderId)) {
      throw createHttpError(400, 'Folder ID is not valid');
    }

    return this.services.Folder.acquireLock(user.id, folderId, lockId)
      .then(() => {
        res.status(201).end();
      })
      .catch(() => {
        res.status(409).end();
      });
  }

  public async refreshFolderLock(req: Request, res: Response): Promise<void> {
    const { user } = req as PassportRequest;
    const { folderId, lockId } = req.params;

    if (Validator.isInvalidPositiveNumber(folderId)) {
      throw createHttpError(400, 'Folder ID is not valid');
    }

    return this.services.Folder.refreshLock(user.id, folderId, lockId)
      .then(() => {
        res.status(200).end();
      })
      .catch(() => {
        res.status(409).end();
      });
  }

  public async releaseFolderLock(req: Request, res: Response): Promise<void> {
    const { user } = req as PassportRequest;
    const { folderId, lockId } = req.params;

    if (Validator.isInvalidPositiveNumber(folderId)) {
      throw createHttpError(400, 'Folder ID is not valid');
    }

    return this.services.Folder.releaseLock(user.id, folderId, lockId)
      .then(() => {
        res.status(200).end();
      })
      .catch((err: any) => {
        if (err instanceof LockNotAvaliableError) res.status(404).end();

        this.logger.error('Error releasing a lock', err.message);
        res.status(500).end();
      });
  }

  public async acquireOrRefreshFolderLock(req: Request, res: Response): Promise<void> {
    const { user } = req as PassportRequest;
    const { folderId, lockId } = req.params;

    if (Validator.isInvalidPositiveNumber(folderId)) {
      throw createHttpError(400, 'Folder ID is not valid');
    }

    return this.services.Folder.acquireOrRefreshLock(user.id, folderId, lockId)
      .then(() => {
        res.status(200).end();
      })
      .catch((err: any) => {
        if (err instanceof LockNotAvaliableError) res.status(409).end();

        this.logger.error('Error adquiring or refreshing a lock', err.message);
        res.sendStatus(500);
      });
  }

  public async renameFileInNetwork(req: Request, res: Response): Promise<void> {
    const { behalfUser: user } = req as SharedRequest;
    const { bucketId, fileId, relativePath } = req.body;
    const mnemonic = req.headers['internxt-mnemonic'];

    if (Validator.isInvalidString(fileId)) {
      throw createHttpError(400, 'File ID is not valid');
    }

    if (Validator.isInvalidString(bucketId)) {
      throw createHttpError(400, 'Bucket ID is not valid');
    }

    if (Validator.isInvalidString(relativePath)) {
      throw createHttpError(400, 'Relative path is not valid');
    }

    if (Validator.isInvalidString(mnemonic)) {
      throw createHttpError(400, 'Mnemonic is not valid');
    }

    return this.services.Inxt.renameFile(user.email, user.userId, mnemonic, bucketId, fileId, relativePath)
      .then(() => {
        res.status(200).json({
          message: `File renamed in network: ${fileId}`,
        });
      })
      .catch((error: Error) => {
        res.status(500).json({
          error: error.message,
        });
      });
  }

  public async fixDuplicate(req: Request, res: Response): Promise<void> {
    const { user } = req as PassportRequest;

    return this.services.Folder.changeDuplicateName(user)
      .then((result: unknown) => {
        res.status(204).json(result);
      })
      .catch((err: Error) => {
        res.status(500).json(err.message);
      });
  }

  getDirectoryFiles(req: Request, res: Response): void {
    const { user } = req as PassportRequest;
    const folderId = req.params.id;
    const offset = req.query.offset;
    const limit = req.query.limit;

    if (Validator.isInvalidUnsignedNumber(offset)) {
      throw createHttpError(400, 'Offset should be positive');
    }

    if (Validator.isInvalidUnsignedNumber(limit)) {
      throw createHttpError(400, 'Limit should be positive');
    }

    this.services.Folder.getUserDirectoryFiles(user.id, folderId, Number(offset), Number(limit))
      .then((content: { files: any[]; last: boolean }) => {
        res.status(200).send(content);
      })
      .catch((err: Error) => {
        this.logger.error('getDirectoryFiles: %s. STACK %s', err.message, err.stack || 'NO STACK');

        res.status(500).send({ error: 'Internal Server Error' });
      });
  }

  getDirectoryFolders(req: Request, res: Response): void {
    const { user } = req as PassportRequest;
    const folderId = req.params.id;
    const offset = req.query.offset;
    const limit = req.query.limit;

    if (Validator.isInvalidUnsignedNumber(offset)) {
      throw createHttpError(400, 'Offset should be positive');
    }

    if (Validator.isInvalidUnsignedNumber(limit)) {
      throw createHttpError(400, 'Limit should be positive');
    }

    this.services.Folder.getUserDirectoryFolders(user.id, folderId, Number(offset), Number(limit))
      .then((content: { folders: any[]; last: boolean }) => {
        res.status(200).send(content);
      })
      .catch((err: Error) => {
        this.logger.error('getDirectoryFolders: %s. STACK %s', err.message, err.stack || 'NO STACK');

        res.status(500).send({ error: 'Internal Server Error' });
      });
  }

  public async createThumbnail(req: Request, res: Response) {
    const { behalfUser } = req as SharedRequest;
    const { thumbnail } = req.body;

    if (
      !thumbnail ||
      !thumbnail.file_id ||
      !thumbnail.max_width ||
      !thumbnail.max_height ||
      !thumbnail.type ||
      !thumbnail.size ||
      !thumbnail.bucket_id ||
      !thumbnail.bucket_file ||
      !thumbnail.encrypt_version
    ) {
      this.logger.error(
        `Invalid metadata trying to create a thumbnail for user 
          ${behalfUser.email}: ${JSON.stringify(thumbnail, null, 2)}`,
      );
      return res.status(400).json({ error: 'Invalid metadata for new thumbnail' });
    }

    const result = await this.services.Thumbnails.CreateThumbnail(behalfUser, thumbnail);

    res.status(200).json(result);
  }
}

export default (router: Router, service: any) => {
  const Logger = logger.getInstance();
  const { passportAuth } = passport;
  const sharedAdapter = sharedMiddlewareBuilder.build(service);
  const teamsAdapter = teamsMiddlewareBuilder.build(service);
  const controller = new StorageController(service, Logger);

  router.post('/storage/file', passportAuth, sharedAdapter, controller.createFile.bind(controller));
  router.post('/storage/thumbnail', passportAuth, sharedAdapter, controller.createThumbnail.bind(controller));
  router.post('/storage/folder', passportAuth, controller.createFolder.bind(controller));
  router.get('/storage/tree', passportAuth, controller.getTree.bind(controller));
  router.get('/storage/tree/:folderId', passportAuth, controller.getTreeSpecific.bind(controller));
  router.delete('/storage/folder/:id', passportAuth, sharedAdapter, controller.deleteFolder.bind(controller));
  router.post('/storage/move/folder', passportAuth, sharedAdapter, controller.moveFolder.bind(controller));
  router.post('/storage/folder/:folderid/meta', passportAuth, sharedAdapter, controller.updateFolder.bind(controller));
  router.get(
    '/storage/v2/folder/:id/:idTeam?',
    passportAuth,
    sharedAdapter,
    teamsAdapter,
    controller.getFolderContents.bind(controller),
  );
  router.get('/storage/folder/size/:id', passportAuth, controller.getFolderSize.bind(controller));
  router.post('/storage/move/file', passportAuth, sharedAdapter, controller.moveFile.bind(controller));
  router.post('/storage/file/:fileid/meta', passportAuth, sharedAdapter, controller.updateFile.bind(controller));
  router.delete('/storage/bucket/:bucketid/file/:fileid', passportAuth, controller.deleteFileBridge.bind(controller));
  router.delete(
    '/storage/folder/:folderid/file/:fileid',
    passportAuth,
    sharedAdapter,
    controller.deleteFileDatabase.bind(controller),
  );
  router.get('/storage/recents', passportAuth, sharedAdapter, controller.getRecentFiles.bind(controller));
  router.post('/storage/folder/:folderId/lock/:lockId', passportAuth, controller.acquireFolderLock.bind(controller));
  router.put('/storage/folder/:folderId/lock/:lockId', passportAuth, controller.refreshFolderLock.bind(controller));
  router.put(
    '/storage/folder/:folderId/lock/:lockId/acquireOrRefresh',
    passportAuth,
    controller.acquireOrRefreshFolderLock.bind(controller),
  );
  router.delete('/storage/folder/:folderId/lock/:lockId', passportAuth, controller.releaseFolderLock.bind(controller));
  router.post(
    '/storage/rename-file-in-network',
    passportAuth,
    sharedAdapter,
    controller.renameFileInNetwork.bind(controller),
  );
  router.post('/storage/folder/fixduplicate', passportAuth, controller.fixDuplicate.bind(controller));

  /**
   * V2 starts here (which will replace V1 and the /v2 will be removed)
   */
  router.get('/storage/v2/folders/:id/files', passportAuth, controller.getDirectoryFiles.bind(controller));
  router.get('/storage/v2/folders/:id/folders', passportAuth, controller.getDirectoryFolders.bind(controller));
};
