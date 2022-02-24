const passport = require('../middleware/passport');
const sharedMiddlewareBuilder = require('../middleware/shared-workspace');
const logger = require('../../lib/logger').default;
const AnalyticsService = require('../../lib/analytics/AnalyticsService');
const CONSTANTS = require('../constants');
const { default: Notifications } = require('../../config/initializers/notifications');
const Logger = logger.getInstance();

const { passportAuth } = passport;

module.exports = (Router, Service, App) => {
  const sharedAdapter = sharedMiddlewareBuilder.build(Service);

  Router.get('/storage/folder/size/:id', passportAuth, async (req, res) => {
    const { params, user } = req;
    const folderId = params.id;
    const size = await Service.Share.getFolderSize(folderId, user.id);
    res.status(200).json({
      size: size,
    });
  });

  Router.post('/storage/rename-file-in-network', passportAuth, sharedAdapter, (req, res) => {
    const { bucketId, fileId, relativePath } = req.body;
    const mnemonic = req.headers['internxt-mnemonic'];
    const { behalfUser: user } = req;

    App.services.Inxt.renameFile(user.email, user.userId, mnemonic, bucketId, fileId, relativePath)
      .then(() => {
        res.status(200).json({ message: `File renamed in network: ${fileId}` });
      })
      .catch((error) => {
        res.status(500).json({ error: error.message });
      });
  });

  Router.post('/storage/file/:fileid/meta', passportAuth, sharedAdapter, (req, res) => {
    const { behalfUser: user } = req;
    const fileId = req.params.fileid;
    const { metadata, bucketId, relativePath } = req.body;
    const mnemonic = req.headers['internxt-mnemonic'];
    const clientId = req.headers['internxt-client-id'];

    Service.Files.UpdateMetadata(user, fileId, metadata, mnemonic, bucketId, relativePath)
      .then(async (result) => {
        res.status(200).json(result);
        const workspaceMembers = await App.services.User.findWorkspaceMembers(user.bridgeUser);

        workspaceMembers.forEach(
          ({ email }) => void Notifications.getInstance().fileUpdated({ file: result, email, clientId }),
        );
      })
      .catch((err) => {
        Logger.error(`Error updating metadata from file ${fileId} : ${err}`);
        res.status(500).json(err.message);
      });
  });

  Router.post('/storage/move/file', passportAuth, sharedAdapter, (req, res) => {
    const { fileId, destination } = req.body;
    const { behalfUser: user } = req;
    const clientId = req.headers['internxt-client-id'];

    Service.Files.MoveFile(user, fileId, destination)
      .then(async (result) => {
        res.status(200).json(result);
        const workspaceMembers = await App.services.User.findWorkspaceMembers(user.bridgeUser);

        workspaceMembers.forEach(
          ({ email }) => void Notifications.getInstance().fileUpdated({ file: result.result, email, clientId }),
        );
      })
      .catch((err) => {
        Logger.error(err);
        res.status(err.status || 500).json({ error: err.message });
      });
  });

  /*
   * Delete file by bridge (mongodb) ids
   */
  Router.delete('/storage/bucket/:bucketid/file/:fileid', passportAuth, (req, res) => {
    if (req.params.bucketid === 'null') {
      return res.status(500).json({ error: 'No bucket ID provided' });
    }

    if (req.params.fileid === 'null') {
      return res.status(500).json({ error: 'No file ID provided' });
    }

    const { user } = req;
    const bucketId = req.params.bucketid;
    const fileIdInBucket = req.params.fileid;

    return Service.Files.Delete(user, bucketId, fileIdInBucket)
      .then(() => {
        res.status(200).json({ deleted: true });
      })
      .catch((err) => {
        Logger.error(err.stack);
        res.status(500).json({ error: err.message });
      });
  });

  /*
   * Delete file by database ids (sql)
   */
  Router.delete('/storage/folder/:folderid/file/:fileid', passportAuth, sharedAdapter, (req, res) => {
    const { behalfUser: user, params } = req;
    const { folderid, fileid } = params;
    const clientId = req.headers['internxt-client-id'];

    Service.Files.DeleteFile(user, folderid, fileid)
      .then(async () => {
        res.status(200).json({ deleted: true });
        const workspaceMembers = await App.services.User.findWorkspaceMembers(user.bridgeUser);

        workspaceMembers.forEach(
          ({ email }) => void Notifications.getInstance().fileDeleted({ id: fileid, email, clientId }),
        );

        AnalyticsService.trackFileDeleted(req);
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  });

  Router.post('/storage/folder/fixduplicate', passportAuth, (req, res) => {
    const { user } = req;

    Service.Folder.changeDuplicateName(user)
      .then((result) => {
        res.status(204).json(result);
      })
      .catch((err) => {
        res.status(500).json(err.message);
      });
  });

  Router.post('/storage/share/folder/:id', passportAuth, sharedAdapter, async (req, res) => {
    const { behalfUser: user } = req;
    const folderId = req.params.id;
    const { views, bucketToken, bucket, mnemonic } = req.body;

    const token = await Service.Share.GenerateFolderTokenAndCode(user, folderId, bucket, mnemonic, bucketToken, views);

    res.status(200).send({
      token: token,
    });

    AnalyticsService.trackShareLinkCopied(user.uuid, views, req);
  });

  Router.get('/storage/share/:token', (req, res) => {
    Service.Share.getFileInfo(req.params.token)
      .then((share) => {
        res.status(200).json(share);

        AnalyticsService.trackSharedLink(req, share);
      })
      .catch((err) => {
        res.status(500).send({ error: err.message });
      });
  });

  Router.get('/storage/shared-folder/:token', async (req, res) => {
    const result = await Service.Share.getFolderInfo(req.params.token);
    res.status(200).json(result);
  });

  Router.get('/storage/share/down/folders', async (req, res) => {
    let { token, directoryId, offset, limit } = req.query;
    const result = await Service.Share.getSharedDirectoryFolders(directoryId, Number(offset), Number(limit), token);
    res.status(200).json(result);
  });

  Router.get('/storage/share/down/files', async (req, res) => {
    let { token, code, directoryId, offset, limit } = req.query;
    const result = await Service.Share.getSharedDirectoryFiles(directoryId, Number(offset), Number(limit), token, code);
    res.status(200).json(result);
  });


  // Needs db index
  Router.get('/storage/recents', passportAuth, sharedAdapter, (req, res) => {
    let { limit } = req.query;

    limit = Math.min(parseInt(limit, 10), CONSTANTS.RECENTS_LIMIT) || CONSTANTS.RECENTS_LIMIT;

    Service.Files.getRecentFiles(req.behalfUser, limit)
      .then((files) => {
        if (!files) {
          return res.status(404).send({ error: 'Files not found' });
        }

        files = files.map((file) => ({
          ...file,
          name: App.services.Crypt.decryptName(file.name, file.folder_id),
        }));

        return res.status(200).json(files);
      })
      .catch((err) => {
        Logger.error(`Can not get recent files: ${req.user.email} : ${err.message}`);
        res.status(500).send({ error: 'Can not get recent files' });
      });
  });

  Router.post('/storage/folder/:folderId/lock/:lockId', passportAuth, (req, res) => {
    const userId = req.user.id;
    const { folderId, lockId } = req.params;

    Service.Folder.acquireLock(userId, folderId, lockId)
      .then(() => {
        res.status(201).end();
      })
      .catch(() => {
        res.status(409).end();
      });
  });

  Router.put('/storage/folder/:folderId/lock/:lockId', passportAuth, (req, res) => {
    const userId = req.user.id;
    const { folderId, lockId } = req.params;

    Service.Folder.refreshLock(userId, folderId, lockId)
      .then(() => {
        res.status(200).end();
      })
      .catch(() => {
        res.status(409).end();
      });
  });

  Router.delete('/storage/folder/:folderId/lock/:lockId', passportAuth, (req, res) => {
    const userId = req.user.id;
    const { folderId, lockId } = req.params;

    Service.Folder.releaseLock(userId, folderId, lockId)
      .then(() => {
        res.status(200).end();
      })
      .catch(() => {
        res.status(404).end();
      });
  });
};
