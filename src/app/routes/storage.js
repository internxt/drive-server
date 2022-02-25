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
