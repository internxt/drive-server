const fs = require('fs');
const contentDisposition = require('content-disposition');
const passport = require('../middleware/passport');
const upload = require('../middleware/multer');

const { passportAuth } = passport;
const logger = require('../../lib/logger');

const log = logger.getInstance();

module.exports = (Router, Service, App) => {
  /**
  * @swagger
  * /register:
  *   post:
  *     description: User registration. User is registered or created.
  *     produces:
  *       - application/json
  *     parameters:
  *       - description: user object with all registration info
  *         in: body
  *         required: true
  *     responses:
  *       200:
  *         description: Successfull user registration
  *       204:
  *         description: User with this email exists
  */
  Router.post('/photos/register', async (req, res) => {
    // Data validation for process only request with all data
    if (req.body.email && req.body.password) {
      req.body.email = req.body.email.toLowerCase().trim();
      log.warn('[ PHOTOS ] Register request for %s from %s', req.body.email, req.headers['X-Forwarded-For']);

      const newUser = req.body;

      // Call user service to find or create global user
      Service.UserPhotos.UserFindOrCreate(newUser)
        .then(async (userData) => {
          // Process user data and find or create Photos user
          if (userData.isNewRecord) {
            const photosUser = await Service.UserPhotos.UserPhotosFindOrCreate(userData);
            // Successfull register
            const token = passport.Sign(userData.email, App.config.get('secrets').JWT);
            const user = { email: userData.email };
            res.status(200).send({ token, user, uuid: userData.uuid });
          } else {
            // This account already exists
            res.status(400).send({ message: 'This account already exists' });
          }
        })
        .catch((err) => {
          log.error(`${err.message}\n${err.stack}`);
          res.status(500).send({ message: err.message });
        });
    } else {
      res.status(400).send({ message: 'You must provide registration data' });
    }
  });

  /**
   * @swagger
   * /login:
   *   post:
   *     description: User login. Check if user exists.
   *     produces:
   *       - application/json
   *     parameters:
   *       - description: user object with email
   *         in: body
   *         required: true
   *     responses:
   *       200:
   *         description: Email exists
   *       204:
   *         description: Wrong username or password
   */
  Router.post('/photos/login', (req, res) => {
    req.body.email = req.body.email.toLowerCase();
    if (!req.body.email) {
      return res.status(400).send({ error: 'No email address specified' });
    }

    // Call user service to find user
    return Service.UserPhotos.FindUserByEmail(req.body.email)
      .then((userData) => {
        if (!userData) {
          // Wrong user
          return res.status(400).json({ error: 'Wrong email/password' });
        }

        return Service.StorjPhotos.IsUserActivated(req.body.email)
          .then((resActivation) => {
            if (!resActivation.data.activated) {
              res.status(400).send({ error: 'User is not activated' });
            } else {
              const encSalt = App.services.Crypt.encryptText(
                userData.hKey.toString()
              );
              const required2FA = userData.secret_2FA && userData.secret_2FA.length > 0;
              res.status(200).send({ sKey: encSalt, tfa: required2FA });
            }
          })
          .catch((err) => {
            res.status(400).send({
              error: 'User not found on Bridge database',
              message: err.response ? err.response.data : err
            });
          });
      })
      .catch((err) => {
        log.error(`${err}: ${req.body.email}`);
        res.status(400).send({
          error: 'User not found on InxtPhotos database',
          message: err.message
        });
      });
  });

  /**
   * @swagger
   * /access:
   *   post:
   *     description: User login second part. Check if password is correct.
   *     produces:
   *       - application/json
   *     parameters:
   *       - description: user object with email and password
   *         in: body
   *         required: true
   *     responses:
   *       200:
   *         description: Successfull login
   *       204:
   *         description: Wrong username or password
   */
  Router.post('/photos/access', (req, res) => {
    const MAX_LOGIN_FAIL_ATTEMPTS = 3;

    // Call user service to find or create user
    App.services.UserPhotos.FindUserByEmail(req.body.email)
      .then(async (userData) => {
        if (userData.errorLoginCount >= MAX_LOGIN_FAIL_ATTEMPTS) {
          res.status(500).send({
            error: 'Your account has been blocked for security reasons. Please reach out to us'
          });

          return;
        }

        let userPhotos = await App.services.UserPhotos.FindUserById(userData.id);

        if (!userPhotos) {
          userPhotos = await App.services.UserPhotos.UserPhotosFindOrCreate(userData);
        }

        // Process user data and answer API call
        const pass = App.services.Crypt.decryptText(req.body.password);

        // 2-Factor Auth. Verification
        const needsTfa = userData.secret_2FA && userData.secret_2FA.length > 0;
        let tfaResult = true;

        /* if (needsTfa) {
          tfaResult = speakeasy.totp.verifyDelta({
            secret: userData.secret_2FA,
            token: req.body.tfa,
            encoding: 'base32',
            window: 2
          });
        } */

        if (!tfaResult) {
          res.status(400).send({ error: 'Wrong 2-factor auth code' });
        } else if (pass === userData.password.toString() && tfaResult) {
          // Successfull login
          const internxtClient = req.headers['internxt-client'];
          const token = passport.Sign(
            userData.email,
            App.config.get('secrets').JWT,
            'inxt-photos',
            internxtClient === 'x-cloud-web' || internxtClient === 'drive-web'
          );

          // Service.UserPhotos.LoginFailed(req.body.email, false);
          // Service.UserPhotos.UpdateAccountActivity(req.body.email);

          res.status(200).json({
            user: {
              email: userData.email,
              mnemonic: userData.mnemonic.toString(),
              rootAlbumId: userPhotos.rootAlbumId,
              rootPreviewId: userPhotos.rootPreviewId,
              name: userData.name,
              lastname: userData.lastname,
              uuid: userData.uuid
            },
            token
          });
        } else {
          // Wrong password
          if (pass !== userData.password.toString()) {
            Service.User.LoginFailed(req.body.email, true);
          }

          res.status(400).json({ error: 'Wrong email/password' });
        }
      })
      .catch((err) => {
        log.error(`${err.message}\n${err.stack}`);
        res.status(400).send({ error: 'User not found on Cloud database', message: err.message });
      });
  });

  /**
   * @swagger
   * /initialize:
   *   post:
   *     description: User bridge initialization (creation of bucket and folder).
   *     produces:
   *       - application/json
   *     parameters:
   *       - description: user object with all info
   *         in: body
   *         required: true
   *     responses:
   *       200:
   *         description: Successfull user initialization
   *       204:
   *         description: User needs to be activated
   */
  Router.post('/photos/initialize', (req, res) => {
    // Call user service to find or create user
    Service.UserPhotos.InitializeUserPhotos(req.body)
      .then(async (userData) => {
        // Process user data and answer API call
        if (userData.rootAlbumId && userData.rootPreviewId && userData.deleteFolderId) {
          // Successfull initialization
          const user = {
            email: userData.email,
            mnemonic: userData.mnemonic,
            rootAlbumId: userData.rootAlbumId,
            rootPreviewId: userData.rootPreviewId,
            deleteFolderId: userData.deleteFolderId
          };

          res.status(200).send({ user });
        } else {
          // User initialization unsuccessful
          res.status(400).send({ message: 'Your account can\'t be initialized' });
        }
      })
      .catch((err) => {
        log.error(`${err.message}\n${err.stack}`);
        res.send(err.message);
      });
  });

  Router.get('/photos/user/activations/:token', (req, res) => {
    Service.UserPhotos.ActivateUser(req.params.token).then((response) => {
      const body = response.data;
      // Service.Analytics.track({ userId: body.uuid, event: 'user-activated', properties: { email: body.id } })
      res.status(200).send(body);
    }).catch((err) => {
      res.status(err.response.status).send(err.response.data);
    });
  });

  Router.get('/photos/user/isactivated', passportAuth, (req, res) => {
    const user = req.user.email;

    Service.StorjPhotos.IsUserActivated(user)
      .then((response) => {
        if (response.data) {
          res.status(200).send({ activated: response.data.activated });
        } else {
          res.status(400).send({ error: '[ PHOTOS ] User activation info not found' });
        }
      })
      .catch((error) => {
        log.error(error.stack);
        res.status(500).json({ error: error.message });
      });
  });

  /**
   * @swagger
   * /photos/storage/albums/:email:
   *   post:
   *     description: Get album list of user
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: photoId
   *         description: ID of photo in XCloud
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Uploaded object
   */
  Router.get('/photos/storage/albums/:email', passportAuth, (req, res) => {
    const { email } = req.params;

    Service.UserPhotos.FindUserByEmail(email).then(async (userData) => {
      const albumList = await Service.Photos.GetAlbumList(userData.usersphoto.id);
      console.log('ALBUM LIST', albumList);
      res.status(200).send(albumList);
    }).catch((err) => {
      log.error('[GET ALBUMS............]', err);
      res.status(500).json({ error: err.message });
    });
  });

  Router.get('/photos/storage/previews/:email', passportAuth, (req, res) => {
    const { email } = req.params;
    Service.UserPhotos.FindUserByEmail(email).then(async (userData) => {
      const allPhotos = await Service.Photos.GetAllPhotosContent(userData, userData.usersphoto);

      res.status(200).send(allPhotos);
    }).catch((err) => {
      log.error('[GET ALL]', err);
      res.status(500).json({ error: err.message });
    });
  });

  Router.get('/photos/storage/deletes/:email', passportAuth, (req, res) => {
    const { email } = req.params;

    Service.UserPhotos.FindUserByEmail(email).then(async (userData) => {
      const deletedPhotos = await Service.Photos.GetDeletedPhotos(userData.usersphoto.deleteFolderId);

      console.log('ALL DELETED.................', deletedPhotos);

      res.status(200).send(deletedPhotos);
    }).catch((err) => {
      log.error('[GET DELETED]', err.message);
      res.status(500).json({ error: err.message });
    });
  });

  /**
   * @swagger
   * /storage/folder/:id:
   *   post:
   *     description: Get album contents.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: folderId
   *         description: ID of album in XCloud
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Array of folder items
   */
  Router.get('/storage/album/:id', passportAuth, (req, res) => {
    const folderId = req.params.id;

    Service.Photos.GetContent(folderId, req.user).then((result) => {
      if (result == null) {
        res.status(500).send([]);
      } else {
        res.status(200).json(result);
      }
    }).catch((err) => {
      log.error(`${err.message}\n${err.stack}`);
      res.status(500).json(err);
    });
  });

  /**
   * @swagger
   * /storage/photo/:id:
   *   post:
   *     description: Download photo
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: photoId
   *         description: ID of photo in XCloud
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Uploaded object
   */
  Router.get('/photos/storage/photo/:id', passportAuth, (req, res) => {
    const { user } = req;
    // Set mnemonic to decrypted mnemonic
    user.mnemonic = req.headers['internxt-mnemonic'];
    const photoId = req.params.id;
    if (photoId === 'null') {
      return res.status(500).send({ message: 'Missing photo id' });
    }

    return Service.Photos.DownloadPhoto(user, photoId).then(({
      filestream, mimetype, downloadPhoto, name, type, size
    }) => {
      const decryptedPhotoName = App.services.Crypt.decryptName(name, 111);
      const photoNameDecrypted = `${decryptedPhotoName}${type ? `.${type}` : ''}`;
      const decryptedPhotoNameB64 = Buffer.from(photoNameDecrypted).toString('base64');

      res.setHeader('content-length', size);
      res.setHeader('content-disposition', contentDisposition(photoNameDecrypted));
      res.setHeader('content-type', mimetype);
      res.set('x-file-name', decryptedPhotoNameB64);
      filestream.pipe(res);

      fs.unlink(downloadPhoto, (error) => {
        if (error) throw error;
      });
    }).catch((err) => {
      if (err.message === 'Bridge rate limit error') {
        return res.status(402).json({ message: err.message });
      }
      return res.status(500).json({ message: err.message });
    });
  });

  /**
   * @swagger
   * /photos/album/:id:
   *   get:
   *     description: Get album contents.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: folderId
   *         description: ID of album in the network.
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Array of album items
   */
  Router.get('/photos/album/:id', passportAuth, (req, res) => {
    const albumId = req.params.id;
    Service.Photos.GetContent(albumId, req.user)
      .then((result) => {
        if (result == null) {
          res.status(500).send([]);
        } else {
          res.status(200).json(result);
        }
      })
      .catch((err) => {
        log.error(`${err.message}\n${err.stack}`);
        res.status(500).json(err);
      });
  });

  /**
   * @swagger
   * /photos/album:
   *   post:
   *     description: Create album.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: albumName
   *         description: Name of the new album.
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Creation response.
   */
  Router.post('/photos/album', passportAuth, async (req, res) => {
    const { name } = req.body;
    const { photos } = req.body;

    const { user } = req;
    const userPhotos = await Service.UserPhotos.FindUserByEmail(user.email);

    try {
      const album = await Service.Photos.CreateAlbum(userPhotos.usersphoto.id, name);
      Promise.all(photos.map((item) => {
        return Service.Photos.MoveToAlbum(item.id, album);
      }));

      res.status(200).json({});
    } catch (err) {
      log.warn(err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * @swagger
   * /photos/storage/photo/upload:
   *   post:
   *     description: Upload photo to network
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: xfile
   *         description: Content photo to upload
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Uploaded object
   */
  Router.post('/photos/storage/photo/upload', passportAuth, upload.single('xfile'), async (req, res) => {
    const { user } = req;
    const xphoto = req.file;

    const userPhotos = await Service.UserPhotos.FindUserByEmail(user.email);
    // Set mnemonic to decrypted mnemonic
    userPhotos.mnemonic = req.headers['internxt-mnemonic'];

    Service.Photos.UploadPhoto(
      user,
      userPhotos,
      xphoto.originalname,
      xphoto.path
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

  /**
   * @swagger
   * /photos/storage/preview/upload/:id:
   *   post:
   *     description: Upload photo preview to network
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: folderId
   *         description: ID of photo in database
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Uploaded object
   */
  Router.post('/photos/storage/preview/upload/:id', passportAuth, upload.single('xfile'), async (req, res) => {
    const { user } = req;
    const xpreview = req.file;
    const photoId = req.params.id;

    const userPhotos = await Service.UserPhotos.FindUserByEmail(user.email);
    // Set mnemonic to decrypted mnemonic
    userPhotos.mnemonic = req.headers['internxt-mnemonic'];

    Service.Previews.UploadPreview(
      user,
      userPhotos,
      xpreview.originalname,
      xpreview.path,
      photoId
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

  /**
   * @swagger
   * /photos/storage/photo/:id
   *   get:
   *     description: Download photo of the network.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: picId
   *         description: Photo ID.
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Photo object.
   */
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

  /**
   * @swagger
   * /storage/delete/temp/photo:
   *   post:
   *     description: Move file on cloud DB to delete folder
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: fileId
   *         description: file id
   *         in: body
   *         required: true
   *       - name: destination
   *         description: destination folder
   *         in: body
   *         required: true
   *     responses:
   *       200:
   *         description: File moved successfully
   *       501:
   *         description: File with same name exists in folder destination.
   */
  Router.post('/photos/delete/temp/photo', passportAuth, async (req, res) => {
    const { photoId } = req.body;
    const { user } = req;

    const userInfo = await Service.UserPhotos.FindUserByEmail(user.email);

    const album = await Service.Photos.FindAlbumById(userInfo.usersphoto.deleteFolderId);

    Service.Photos.MoveToAlbum(user, photoId, album).then((result) => {
      res.status(200).json(result);
    }).catch((error) => {
      res.status(500).json(error);
    });
  });
};
