const passport = require('../middleware/passport');
const sharedMiddlewareBuilder = require('../middleware/shared-workspace');
const teamsMiddlewareBuilder = require('../middleware/teams');
const logger = require('../../lib/logger').default;
const AnalyticsService = require('../../lib/analytics/AnalyticsService');
const CONSTANTS = require('../constants');

const Logger = logger.getInstance();

const { passportAuth } = passport;

module.exports = (Router, Service, App) => {
  const sharedAdapter = sharedMiddlewareBuilder.build(Service);
  const teamsAdapter = teamsMiddlewareBuilder.build(Service);

  Router.get('/storage/folder/:id/:idTeam?', passportAuth, (req, res) => {
    const folderId = req.params.id;
    const teamId = req.params.idTeam || null;

    Service.Folder.GetContent(folderId, req.user, teamId).then((result) => {
      if (result == null) {
        res.status(500).send([]);
      } else {
        res.status(200).json(result);
      }
    }).catch((err) => {
      // Logger.error(`${err.message}\n${err.stack}`);
      res.status(500).json(err);
    });
  });

  Router.get('/storage/v2/folder/:id/:idTeam?', passportAuth, sharedAdapter, teamsAdapter, (req, res) => {
    const { params, behalfUser } = req;
    const { id } = params;

    return Promise.all([
      Service.Folder.getById(id),
      Service.Folder.getFolders(id, behalfUser.id),
      Service.Files.getByFolderAndUserId(id, behalfUser.id)
    ]).then(([currentFolder, childrenFolders, childrenFiles]) => {
      if (!currentFolder || !childrenFolders || !childrenFiles) {
        return res.status(400).send();
      }

      return res.status(200).json({
        ...currentFolder,
        children: childrenFolders,
        files: childrenFiles
      });
    }).catch((err) => {
      return res.status(500).json({ error: err.message });
    });
  });

  Router.post('/storage/folder/:folderid/meta', passportAuth, sharedAdapter, (req, res) => {
    const { behalfUser: user } = req;
    const folderId = req.params.folderid;
    const { metadata } = req.body;

    Service.Folder.UpdateMetadata(user, folderId, metadata).then((result) => {
      res.status(200).json(result);
    }).catch((err) => {
      Logger.error(`Error updating metadata from folder ${folderId}: ${err}`);
      res.status(500).json(err.message);
    });
  });

  Router.post('/storage/folder', passportAuth, (req, res) => {
    const { folderName, parentFolderId } = req.body;

    const { user } = req;
    user.mnemonic = req.headers['internxt-mnemonic'];

    Service.Folder.Create(user, folderName, parentFolderId).then((result) => {
      res.status(201).json(result);
    }).catch((err) => {
      Logger.warn(err);
      res.status(500).json({ error: err.message });
    });
  });

  Router.delete('/storage/folder/:id', passportAuth, sharedAdapter, (req, res) => {
    const { behalfUser: user } = req;
    // Set mnemonic to decrypted mnemonic
    user.mnemonic = req.headers['internxt-mnemonic'];
    const folderId = req.params.id;

    Service.Folder.Delete(user, folderId).then((result) => {
      res.status(204).send(result);
    }).catch((err) => {
      Logger.error(`${err.message}\n${err.stack}`);
      res.status(500).send({ error: err.message });
    });
  });

  Router.post('/storage/move/folder', passportAuth, sharedAdapter, (req, res) => {
    const { folderId } = req.body;
    const { destination } = req.body;
    const { behalfUser: user } = req;

    Service.Folder.MoveFolder(user, folderId, destination).then((result) => {
      res.status(200).json(result);
    }).catch((err) => {
      res.status(err.status || 500).json({ error: err.message });
    });
  });

  Router.post('/storage/rename-file-in-network', passportAuth, sharedAdapter, (req, res) => {
    const { bucketId, fileId, relativePath } = req.body;
    const mnemonic = req.headers['internxt-mnemonic'];
    const { behalfUser: user } = req;

    App.services.Inxt.renameFile(user.email, user.userId, mnemonic, bucketId, fileId, relativePath).then(() => {
      res.status(200).json({ message: `File renamed in network: ${fileId}` });
    }).catch((error) => {
      res.status(500).json({ error: error.message });
    });
  });

  Router.post('/storage/file', passportAuth, sharedAdapter, async (req, res) => {
    const { behalfUser } = req;
    const { file } = req.body;
    const internxtClient = req.headers['internxt-client'];

    try {
      const result = await Service.Files.CreateFile(behalfUser, file);

      if (internxtClient === 'drive-mobile') {
        await Service.UsersReferrals.applyUserReferral(behalfUser.id, 'install-mobile-app');
      }

      if (internxtClient === 'drive-desktop') {
        await Service.UsersReferrals.applyUserReferral(behalfUser.id, 'install-desktop-app');
      }

      AnalyticsService.trackUploadCompleted(req, behalfUser);

      res.status(200).json(result);
    } catch (err) {
      Logger.error(err);
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  Router.post('/storage/file/:fileid/meta', passportAuth, sharedAdapter, (req, res) => {
    const { behalfUser: user } = req;
    const fileId = req.params.fileid;
    const { metadata, bucketId, relativePath } = req.body;
    const mnemonic = req.headers['internxt-mnemonic'];

    Service.Files.UpdateMetadata(user, fileId, metadata, mnemonic, bucketId, relativePath).then((result) => {
      res.status(200).json(result);
    }).catch((err) => {
      Logger.error(`Error updating metadata from file ${fileId} : ${err}`);
      res.status(500).json(err.message);
    });
  });

  Router.post('/storage/move/file', passportAuth, sharedAdapter, (req, res) => {
    const {
      fileId, destination, bucketId, relativePath
    } = req.body;
    const { behalfUser: user } = req;
    const mnemonic = req.headers['internxt-mnemonic'];

    Service.Files.MoveFile(user, fileId, destination, bucketId, mnemonic, relativePath).then((result) => {
      res.status(200).json(result);
    }).catch((err) => {
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

    return Service.Files.Delete(user, bucketId, fileIdInBucket).then(() => {
      res.status(200).json({ deleted: true });
    }).catch((err) => {
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

    Service.Files.DeleteFile(user, folderid, fileid).then(() => {
      AnalyticsService.trackFileDeleted(req);

      res.status(200).json({ deleted: true });
    }).catch((err) => {
      res.status(500).json({ error: err.message });
    });
  });

  Router.post('/storage/share/file/:id', passportAuth, sharedAdapter, async (req, res) => {
    const { behalfUser: user } = req;
    const itemId = req.params.id;
    const {
      isFolder, views, encryptionKey, fileToken, bucket
    } = req.body;

    try {
      const result = await Service.Share.GenerateToken(user, itemId, '', bucket, encryptionKey, fileToken, isFolder, views);

      await Service.UsersReferrals.applyUserReferral(user.id, 'share-file');

      AnalyticsService.trackShareLinkCopied(req);

      res.status(200).send({ token: result });
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  });

  Router.post('/storage/folder/fixduplicate', passportAuth, (req, res) => {
    const { user } = req;

    Service.Folder.changeDuplicateName(user).then((result) => {
      res.status(204).json(result);
    }).catch((err) => {
      res.status(500).json(err.message);
    });
  });

  Router.get('/storage/share/:token', (req, res) => {
    Service.Share.get(req.params.token).then((share) => {
      AnalyticsService.trackSharedLink(req, share);

      res.status(200).json(share);
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });

  Router.get('/storage/files/:folderId', passportAuth, (req, res) => {
    const userId = req.user.id;
    const { folderId } = req.params;

    if (!folderId) {
      res.status(400).send({ error: 'Missing folder id' });
    } else {
      Service.Files.getByFolderAndUserId(folderId, userId).then((files) => {
        res.status(200).json(files);
      }).catch((err) => {
        res.status(500).send({ error: err.message });
      });
    }
  });

  // Needs db index
  Router.get('/storage/recents', passportAuth, sharedAdapter, (req, res) => {
    let { limit } = req.query;

    limit = Math.min(parseInt(limit, 10), CONSTANTS.RECENTS_LIMIT) || CONSTANTS.RECENTS_LIMIT;

    Service.Files.getRecentFiles(req.behalfUser.id, limit).then((files) => {
      if (!files) {
        return res.status(404).send({ error: 'Files not found' });
      }

      files = files.map((file) => ({
        ...file,
        name: App.services.Crypt.decryptName(file.name, file.folder_id)
      }));

      return res.status(200).json(files);
    }).catch((err) => {
      Logger.error(`Can not get recent files: ${req.user.email} : ${err.message}`);
      res.status(500).send({ error: 'Can not get recent files' });
    });
  });

  Router.get('/storage/tree', passportAuth, (req, res) => {
    const { user } = req;

    Service.Folder.GetTree(user).then((result) => {
      res.status(200).send(result);
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });

  Router.get('/storage/tree/:folderId', passportAuth, (req, res) => {
    const { user } = req;
    const { folderId } = req.params;

    Service.Folder.GetTree(user, folderId).then((result) => {
      const treeSize = Service.Folder.GetTreeSize(result);

      res.status(200).send({ tree: result, size: treeSize });
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });

  Router.post('/storage/folder/:folderId/lock/:lockId', passportAuth, (req, res) => {
    const userId = req.user.id;
    const {folderId, lockId} = req.params;


    Service.Folder.acquireLock(userId, folderId, lockId).then(() => {
      res.status(201).end();
    }).catch(() => {
      res.status(409).end();
    });
  });

  Router.put('/storage/folder/:folderId/lock/:lockId',  passportAuth, (req, res) => {
    const userId = req.user.id;
    const {folderId, lockId} = req.params;

    Service.Folder.refreshLock(userId, folderId, lockId).then(() => {
      res.status(200).end();
    }).catch(() => {
      res.status(409).end();
    });
  });

  Router.delete('/storage/folder/:folderId/lock/:lockId',  passportAuth, (req, res) => {
    const userId = req.user.id;
    const {folderId, lockId} = req.params;

    Service.Folder.releaseLock(userId, folderId, lockId).then(() => {
      res.status(200).end();
    }).catch(() => {
      res.status(404).end();
    });
  });
};
