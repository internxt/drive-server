const fs = require('fs');

const contentDisposition = require('content-disposition');
const bip39 = require('bip39');
const uuid = require('uuid');

const upload = require('../middleware/multer');
const passport = require('../middleware/passport');
const logger = require('../../lib/logger');
const CONSTANTS = require('../constants');

const Logger = logger.getInstance();

const { passportAuth } = passport;

module.exports = (Router, Service, App) => {
  Router.get('/storage/folder/:id/:idTeam?', passportAuth, (req, res) => {
    const requestId = uuid.v4();
    const folderId = req.params.id;
    const teamId = req.params.idTeam || null;

    Logger.info('FIX20210806 %s User %s request folder %s content (idTeam: %s)', requestId, req.user.email, folderId, teamId);

    Service.Folder.GetContent(folderId, req.user, teamId).then((result) => {
      if (result == null) {
        Logger.error('FIX20210806 %s User %s REQUEST FAIL (empty result: %s)', requestId, req.user.email, result);
        res.status(500).send([]);
      } else {
        Logger.info('FIX20210806 %s User %s REQUEST SUCCESS', requestId, req.user.email);
        res.status(200).json(result);
      }
    }).catch((err) => {
      Logger.error('FIX20210806 %s User %s request folder %s content ERROR', requestId, req.user.email, folderId);
      Logger.error('FIX20210806 %s %s message %s', requestId, req.user.email, err.message);
      Logger.error('FIX20210806 %s %s stack %s', requestId, req.user.email, err.stack);
      // Logger.error(`${err.message}\n${err.stack}`);
      res.status(500).json(err);
    });
  });

  Router.post('/storage/folder/:folderid/meta', passportAuth, (req, res) => {
    const { user } = req;
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

  Router.delete('/storage/folder/:id', passportAuth, (req, res) => {
    const { user } = req;
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

  Router.post('/storage/folder/:id/upload', passportAuth, upload.single('xfile'), (req, res) => {
    const { user } = req;
    // Set mnemonic to decrypted mnemonic
    user.mnemonic = req.headers['internxt-mnemonic'];
    const isValidMnemonic = bip39.validateMnemonic(user.mnemonic);

    if (!isValidMnemonic) {
      return res.status(400).send({ message: 'Missing encryption key' });
    }
    const xfile = req.file;
    const folderId = req.params.id;

    return Service.Files.Upload(user, folderId, xfile.originalname, xfile.path)
      .then((result) => {
        res.status(201).json(result);
      })
      .catch((err) => {
        Logger.error(`${err.message}\n${err.stack}`);
        if (err.includes && err.includes('Bridge rate limit error')) {
          res.status(402).json({ message: err });
          return;
        }

        res.status(500).json({ message: err });
      });
  });

  Router.post('/storage/moveFolder', passportAuth, (req, res) => {
    const { folderId } = req.body;
    const { destination } = req.body;
    const { user } = req;

    Service.Folder.MoveFolder(user, folderId, destination).then((result) => {
      res.status(200).json(result);
    }).catch((error) => {
      res.status(500).json({ error: error.message });
    });
  });

  Router.post('/storage/file', passportAuth, (req, res) => {
    const { user } = req;
    const { file } = req.body;

    Service.Files.CreateFile(user, file).then((result) => {
      res.status(200).json(result);
    }).catch((error) => {
      Logger.error(error);
      res.status(400).json({ message: error.message });
    });
  });

  Router.get('/storage/file/:id', passportAuth, (req, res) => {
    const { user } = req;
    // Set mnemonic to decrypted mnemonic
    user.mnemonic = req.headers['internxt-mnemonic'];

    const isValidMnemopnic = bip39.validateMnemonic(user.mnemonic);

    if (!isValidMnemopnic) {
      return res.status(400).send({ message: 'Missing encryption key' });
    }

    const fileIdInBucket = req.params.id;
    if (fileIdInBucket === 'null') {
      return res.status(500).send({ message: 'Missing file id' });
    }

    return Service.Files.Download(user, fileIdInBucket).then(({
      filestream, mimetype, downloadFile, folderId, name, type, size
    }) => {
      const decryptedFileName = App.services.Crypt.decryptName(name, folderId);

      const fileNameDecrypted = `${decryptedFileName}${type ? `.${type}` : ''}`;
      const decryptedFileNameB64 = Buffer.from(fileNameDecrypted).toString('base64');

      res.setHeader('content-length', size);
      res.setHeader('content-disposition', contentDisposition(fileNameDecrypted));
      res.setHeader('content-type', mimetype);
      res.set('x-file-name', decryptedFileNameB64);
      filestream.pipe(res);
      fs.unlink(downloadFile, (error) => {
        if (error) throw error;
      });
    }).catch((err) => {
      if (err.message === 'Bridge rate limit error') {
        return res.status(402).json({ message: err.message });
      }
      return res.status(500).json({ message: err.message });
    });
  });

  Router.post('/storage/file/:fileid/meta', passportAuth, (req, res) => {
    const { user } = req;
    const fileId = req.params.fileid;
    const { metadata } = req.body;

    Service.Files.UpdateMetadata(user, fileId, metadata).then((result) => {
      res.status(200).json(result);
    }).catch((err) => {
      Logger.error(`Error updating metadata from file ${fileId} : ${err}`);
      res.status(500).json(err.message);
    });
  });

  Router.post('/storage/moveFile', passportAuth, (req, res) => {
    const { fileId } = req.body;
    const { destination } = req.body;
    const { user } = req;

    Service.Files.MoveFile(user, fileId, destination).then((result) => {
      res.status(200).json(result);
    }).catch((err) => {
      Logger.error(err);
      res.status(500).json({ error: err.message });
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
   * Delete file by database ids (mysql)
   */
  Router.delete('/storage/folder/:folderid/file/:fileid', passportAuth, (req, res) => {
    Service.Files.DeleteFile(req.user, req.params.folderid, req.params.fileid).then(() => {
      res.status(200).json({ deleted: true });
    }).catch((err) => {
      res.status(500).json({ error: err.message });
    });
  });

  Router.post('/storage/share/file/:id', passportAuth, (req, res) => {
    const user = req.user.email;
    const itemId = req.params.id;
    const {
      isFolder, views, encryptionKey, fileToken, bucket
    } = req.body;

    Service.Share.GenerateToken(user, itemId, '', bucket, encryptionKey, fileToken, isFolder, views).then((result) => {
      res.status(200).send({ token: result });
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
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
      res.status(200).json(share);
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });

  // TODO: Dejar de usar este endpoint en todas las plataformas
  Router.get('/storage/user/info/stripe/:isTest', passportAuth, async (req, res) => {
    Service.Stripe.getProductFromUser(req.user.email, req.params.isTest).then((product) => {
      if (!product) {
        return res.status(404).send({ error: 'Product not found' });
      }
      return res.status(200).json(product);
    }).catch((err) => {
      if (err.statusCode) {
        res.status(err.statusCode).send({ error: err.message });
      } else {
        res.status(500).send({ error: 'Can not get stripe info of the user' });
      }
      Logger.error(`Error get product stripe info from ${req.user.email}: ${err.message}`);
    });
  });

  Router.get('/storage/recents', passportAuth, (req, res) => {
    let { limit } = req.query;

    limit = Math.min(parseInt(limit, 10), CONSTANTS.RECENTS_LIMIT) || CONSTANTS.RECENTS_LIMIT;

    Service.Files.getRecentFiles(req.user.id, limit).then((files) => {
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

  Router.get('/storage/file/info/:fileId/:folderId', passportAuth, (req, res) => {
    const { fileId, folderId } = req.params;

    Service.Files.getFileByFolder(fileId, folderId, req.user.id).then((file) => {
      if (!file) {
        return res.status(404).send({ error: 'Folder not found' });
      }

      return res.status(200).json(file);
    }).catch((err) => {
      Logger.error(`Can not get the file: ${req.user.email} : ${err.message}`);
      res.status(500).send({ error: 'Can not get the file' });
    });
  });
};
