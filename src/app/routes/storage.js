const passport = require('../middleware/passport');
const sharedMiddlewareBuilder = require('../middleware/shared-workspace');

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
