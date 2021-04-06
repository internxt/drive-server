const fs = require('fs');
const contentDisposition = require('content-disposition');
const passport = require('../middleware/passport');
const upload = require('../middleware/multer');

const { passportAuth } = passport;
const logger = require('../../lib/logger');

const log = logger.getInstance();

module.exports = (Router, Service, App) => {
  Router.get('/photos/user', passportAuth, async (req, res) => {
    const userPhotos = await App.services.UserPhotos.FindUserById(req.user.id);
    if (userPhotos) {
      res.status(200).send(userPhotos.toJSON());
    } else {
      res.status(400).send({});
    }
  });

  Router.get('/photos/initialize', passportAuth, (req, res) => {
    const inputData = {
      email: req.user.email,
      mnemonic: req.headers['internxt-mnemonic']
    };
    Service.UserPhotos.InitializeUserPhotos(inputData).then((userData) => {
      res.status(200).send({ user: userData });
    }).catch(() => {
      res.status(500).send({ message: 'Your account can\'t be initialized' });
    });
  });

  Router.get('/photos/storage/previews/:id', passportAuth, (req, res) => {
    const { user } = req;
    // Set mnemonic to decrypted mnemonic
    user.mnemonic = req.headers['internxt-mnemonic'];
    const fileIdInBucket = req.params.id;
    if (!fileIdInBucket || fileIdInBucket === 'null') {
      return res.status(500).send({ message: 'Missing photo id' });
    }

    return Service.Photos.DownloadPreview(user, fileIdInBucket).then(({
      filestream, mimetype, downloadFile, name, type, size
    }) => {
      const decryptedFileName = App.services.Crypt.decryptName(name, 111);

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

  Router.get('/photos/previews', passportAuth, (req, res) => {
    const { user } = req;

    Service.Photos.getPhotosByUser(user).then(async (userData) => {
      const listPreviews = await Service.Photos.getPreviewsByBucketId(userData.rootPreviewId);

      res.status(200).send(listPreviews);
    }).catch((err) => {
      res.status(500).json({ error: err.message });
    });
  });

  Router.get('/photos/storage/albums', passportAuth, (req, res) => {
    const { email } = req.user;

    Service.UserPhotos.FindUserByEmail(email).then(async (userData) => {
      const albumList = await Service.Photos.GetAlbumList(userData.usersphoto.id);
      res.status(200).send(albumList);
    }).catch((err) => {
      res.status(500).json({ error: err.message });
    });
  });

  Router.get('/photos/storage/photosalbum', passportAuth, (req, res) => {
    const { email } = req.user;

    Service.UserPhotos.FindUserByEmail(email)
      .then((userData) => Service.Photos.GetAlbumContent(userData.usersphoto.id))
      .then((albumPhotos) => {
        res.status(200).send(albumPhotos);
      }).catch((err) => {
        res.status(500).json({ error: err.message });
      });
  });

  Router.get('/photos/storage/photos', passportAuth, (req, res) => {
    const { email } = req.user;
    Service.UserPhotos.FindUserByEmail(email).then(async (userData) => {
      const allPhotos = await Service.Photos.GetAllPhotosContent(userData, userData.usersphoto);
      res.status(200).send(allPhotos);
    }).catch((err) => {
      res.status(500).json({ error: err.message });
    });
  });

  Router.post('/photos/storage/photos/partial', passportAuth, (req, res) => {
    const { email } = req.user;
    Service.UserPhotos.FindUserByEmail(email).then(async (userData) => {
      const allPhotos = await Service.Photos.GetPartialPhotosContent(userData, userData.usersphoto, req.body);
      res.status(200).send(allPhotos);
    }).catch((err) => {
      res.status(500).json({ error: err.message });
    });
  });

  Router.get('/photos/storage/deletes', passportAuth, (req, res) => {
    const { email } = req.params;

    Service.UserPhotos.FindUserByEmail(email).then(async (userData) => {
      const deletedPhotos = await Service.Photos.GetDeletedPhotos(userData.usersphoto.deleteFolderId);
      res.status(200).send(deletedPhotos);
    }).catch((err) => {
      res.status(500).json({ error: err.message });
    });
  });

  Router.get('/photos/storage/album/:id', passportAuth, (req, res) => {
    const albumId = req.params.id;
    Service.Photos.GetAlbumContent(albumId, req.user)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => {
        log.error(`${err.message}\n${err.stack}`);
        res.status(500).json(err);
      });
  });

  Router.post('/photos/album', passportAuth, async (req, res) => {
    const { name } = req.body;
    const { photos } = req.body;

    const { user } = req;
    const userPhotos = await Service.UserPhotos.FindUserByEmail(user.email);

    try {
      const album = await Service.Photos.CreateAlbum(userPhotos.usersphoto.id, name);
      Promise.all(photos.map((item) => {
        return Service.Photos.MoveToAlbum(item, album);
      }));

      res.status(200).json({});
    } catch (err) {
      log.warn(err);
      res.status(500).json({ error: err.message });
    }
  });

  Router.post('/photos/storage/photo/upload', passportAuth, upload.single('xfile'), async (req, res) => {
    const xphoto = req.file;

    const userPhotos = await req.user.getUsersphoto();
    // Set mnemonic to decrypted mnemonic
    req.user.mnemonic = req.headers['internxt-mnemonic'];

    const photoExists = await Service.Photos.FindPhotoByHash(userPhotos, req.body.hash);

    if (photoExists) {
      return res.status(409).json(photoExists);
    }

    Service.Photos.UploadPhoto(
      req.user,
      xphoto.originalname,
      xphoto.path,
      req.body.hash
    ).then((result) => {
      res.status(201).json(result);
    }).catch(async (err) => {
      if (err.includes && err.includes('Bridge rate limit error')) {
        res.status(402).json({ message: err });
        return;
      }

      if (err.includes && err.includes('File already exists')) {
        res.status(409).json({ message: err });
        return;
      }

      res.status(500).json({ message: err });
    });
  });

  Router.post('/photos/storage/preview/upload/:id', passportAuth,
    upload.single('xfile'), async (req, res) => {
      const { user } = req;
      const xpreview = req.file;
      const photoId = req.params.id;

      const usersPhoto = await req.user.getUsersphoto();
      const photo = await Service.Photos.FindPhotoById(usersPhoto, photoId);

      if (!photo) {
        return res.status(400).send({ error: 'Original photo not found' });
      }

      const previewExists = await photo.getPreview();

      if (previewExists) {
        return res.status(409).send(previewExists);
      }

      const userInfo = await Service.UserPhotos.FindUserByEmail(user.email);
      if (!userInfo.usersphoto) {
        res.status(500).send('Internal Server Error');
      }

      // Set mnemonic to decrypted mnemonic
      userInfo.mnemonic = req.headers['internxt-mnemonic'];

      Service.Previews.UploadPreview(
        userInfo,
        xpreview.originalname,
        xpreview.path,
        photoId,
        req.body.hash
      ).then(async (result) => {
        res.status(201).json(result);
      }).catch((err) => {
        log.error(`${err.message}\n${err.stack}`);
        if (err.includes && err.includes('Bridge rate limit error')) {
          res.status(402).json({ message: err });
          return;
        }
        res.status(500).json({ message: err });
      });
    });

  Router.get('/photos/storage/photo/:id', passportAuth, (req, res) => {
    const { user } = req;
    // Set mnemonic to decrypted mnemonic
    user.mnemonic = req.headers['internxt-mnemonic'];
    const fileIdInBucket = req.params.id;
    if (fileIdInBucket === 'null') {
      return res.status(500).send({ message: 'Missing photo id' });
    }

    return Service.Photos.DownloadPhoto(user, fileIdInBucket).then(({
      filestream, mimetype, downloadFile, name, type, size
    }) => {
      const decryptedFileName = App.services.Crypt.decryptName(name, 111);

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
  Router.get('/photos/download/photo/:photoId', passportAuth, (req, res) => {
    const { user } = req;
    // Set mnemonic to decrypted mnemonic
    user.mnemonic = req.headers['internxt-mnemonic'];
    const { photoId } = req.params;
    if (photoId === 'null') {
      return res.status(500).send({ message: 'Missing photo id' });
    }

    return Service.Photos.DownloadPhoto(user, photoId).then(({
      filestream, mimetype, downloadFile, name, type, size
    }) => {
      const decryptedFileName = App.services.Crypt.decryptName(name, 111);

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

  Router.post('/photos/delete/temp/photo', passportAuth, async (req, res) => {
    const { photoId } = req.body;
    const { user } = req;

    const userInfo = await Service.UserPhotos.FindUserByEmail(user.email);

    if (!userInfo.usersphoto) {
      res.status(500).send('Internal Server Error');
    }

    const album = await Service.Photos.FindAlbumById(userInfo.usersphoto.deleteFolderId);

    Service.Photos.MoveToAlbum(user, photoId, album).then((result) => {
      res.status(200).json(result);
    }).catch((error) => {
      res.status(500).json(error);
    });
  });

  Router.delete('/photos/delete/album/:id', passportAuth, async (req, res) => {
    const albumId = req.params.id;
    const { user } = req;

    const userInfo = await Service.UserPhotos.FindUserByEmail(user.email);

    if (!userInfo.usersphoto) {
      res.status(500).send('Internal Server Error');
    }

    Service.Photos.DeleteAlbum(albumId, userInfo.usersphoto.id).then((result) => {
      res.status(204).json(result);
    }).catch((error) => {
      res.status(500).json(error);
    });
  });

  Router.post('/photos/album/photo', passportAuth, async (req, res) => {
    const { photoId } = req.body;
    const { albumId } = req.body;
    const { user } = req;

    const userInfo = await Service.UserPhotos.FindUserByEmail(user.email);

    if (!userInfo.usersphoto) {
      res.status(500).send('Internal Server Error');
    }

    const album = await Service.Photos.FindAlbumById(albumId, userInfo.usersphoto.id);

    Service.Photos.MoveToAlbum(user, photoId, album).then((result) => {
      res.status(200).json(result);
    }).catch((error) => {
      res.status(500).json(error);
    });
  });

  Router.delete('/photos/delete/photo/:id', passportAuth, async (req, res) => {
    const photoId = req.params.id;
    const { user } = req;

    const userInfo = await Service.UserPhotos.FindUserByEmail(user.email);

    if (!userInfo.usersphoto) {
      res.status(500).send('Internal Server Error');
    }

    Service.Photos.DeletePhoto(photoId, userInfo).then((result) => {
      res.status(204).json(result);
    }).catch((error) => {
      res.status(500).json(error);
    });
  });
};
