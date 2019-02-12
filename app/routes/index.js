const jwt = require('jsonwebtoken');
const passport = require('passport')
const fs = require('fs');
const upload = require('./../middleware/multer')
const swaggerSpec = require('./../../config/initializers/swagger')

/**
 * JWT
 */
const passportAuth = passport.authenticate('jwt', {
  session: false
})

module.exports = (Router, Service, Logger, App) => {
  Router.get('/api-docs.json', function(req, res) {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })

  /**
   * @swagger
   * /login:
   *   post:
   *     description: User login. Check if user exists.
   *     produces:
   *       - application/json
   *     parameters:
   *       - description: user object with email and password only
   *         in: body
   *         required: true
   *     responses:
   *       200:
   *         description: Successfull login
   *       204:
   *         description: Wrong username or password
   */

  Router.post('/login', function (req, res) {
    // Call user service to find or create user
    Service.User.FindUserByEmail(req.body.email)
      .then((userData) => {
        // Process user data and answer API call
        if (userData) {
          if (req.body.password == App.services.Crypt.decryptName(userData.password)) {
            // Successfull login
            const token = jwt.sign(userData.email, App.config.get('secrets').JWT);
            res.status(200).json({ token });
          } else {
            // Wrong password
            res.status(204).json({ message: 'Wrong password' })
          }
        } else {
          // User not found
          res.status(204).json({ message: 'Wrong email' })
        }
      }).catch((err) => {
        Logger.error(err.message + '\n' + err.stack);
        res.send(err.message);
      })
  });

  Router.post('/buy', function(req, res) {
	var stripe = require("stripe")("sk_test_eiDRaKtloBuXr2IZ6c3QkFoX");
console.log(stripe);
	res.status(200).json({ message: 'Bien' });
  });

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
  Router.post('/register', function (req, res) {
    // Call user service to find or create user
    Service.User.FindOrCreate(req.body)
      .then((userData) => {
        // Process user data and answer API call
        if (userData.isCreated) {
          // Successfull register
          const token = jwt.sign(userData.email, App.config.get('secrets').JWT);
          res.status(200).send({ token });
        } else {
          // This account already exists
          res.status(204).send({ message: 'This account already exists' });
        }
      }).catch((err) => {
        res.send(err.message);
      })
  });

  Router.put('/auth/mnemonic', function (req, res) {
    const {
      body: { id, mnemonic },
    } = req;
    Service.User.UpdateMnemonic(id, mnemonic)
      .then(() => {
        res.status(200).json({
          message: 'Successfully updated user with mnemonic'
        });
      }).catch(({ message }) => {
        Logger.error(message);
        res.status(400).json({ message, code: 400 });
      });
  })

  /**
   * @swagger
   * /user/:id:
   *   post:
   *     description: Get user.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: folderId
   *         description: ID of user
   *         in: query
   *         required: true
   *     responses:
   *       200:
  */
  Router.get('/users/:id', passportAuth, function(req, res) {
    Service.User.GetUserById(req.params.id).then(function(foundUser) {
      res.send(foundUser);
    }).catch((err) => {
      Logger.error(err.message + '\n' + err.stack);
      res.status(500).json(err)
    });
  });

  /**
   * @swagger
   * /storage/folder/:id:
   *   post:
   *     description: Get folder contents.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: folderId
   *         description: ID of folder in XCloud
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Array of folder items
  */
  Router.get('/storage/folder/:id', passportAuth, function(req, res) {
    const folderId = req.params.id;
    Service.Folder.GetContent(folderId)
      .then((result) => {
        res.status(200).json(result)
      }).catch((err) => {
        Logger.error(err.message + '\n' + err.stack);
        res.status(500).json(err)
      });
  });

  Router.get('/storage/folder/:id/meta', function(req, res) {
    res.send(200)
    // TODO
  });

  /**
   * @swagger
   * /storage/folder:
   *   post:
   *     description: Create folder
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: folderId
   *         description: ID of folder in XCloud
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Array of folder items
  */
  Router.post('/storage/folder', passportAuth, async function(req, res) {
    const folderName = req.body.folderName
    const parentFolderId = req.body.parentFolderId
    const user = req.user
    if (!user.mnemonic) {
      user.mnemonic = req.headers['internxt-mnemonic'];
    }
    Service.Folder.Create(user, folderName, parentFolderId)
      .then((result) => {
        res.status(201).json(result)
      }).catch((err) => {
        Logger.error(err.message + '\n' + err.stack);
        res.status(500).json(err)
      });
  })

  /**
   * @swagger
   * /storage/folder/:id:
   *   post:
   *     description: Delete folder
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: folderId
   *         description: ID of folder in XCloud
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Message
  */
  Router.delete('/storage/folder/:id', passportAuth, async function(req, res) {
    const user = req.user
    const folderId = req.params.id
    if (!user.mnemonic) {
      user.mnemonic = req.headers['internxt-mnemonic'];
    }
    Service.Folder.Delete(user, folderId)
      .then((result) => {
        res.status(204).json(result)
      }).catch((err) => {
        Logger.error(err.message + '\n' + err.stack);
        res.status(500).json(err)
      });
  })

  /**
   * @swagger
   * /storage/folder/:id/upload:
   *   post:
   *     description: Upload content to folder
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: folderId
   *         description: ID of folder in XCloud
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Uploaded object
  */
  Router.post('/storage/folder/:id/upload', passportAuth, upload.single('xfile'), async function(req, res) {
    const user = req.user
    const xfile = req.file
    const folderId = req.params.id
    if (!user.mnemonic) {
      user.mnemonic = req.headers['internxt-mnemonic'];
    }
    Service.Files.Upload(user, folderId, xfile.originalname, xfile.path)
      .then((result) => {
        res.status(201).json(result)
      }).catch((err) => {
        Logger.error(err.message + '\n' + err.stack);
        if (err === 'Bridge rate limit error') {
          res.status(402).json({ message: err })
          return;
        }
        res.status(500).json({ message: err })
      })
  })

  /**
   * @swagger
   * /storage/file/:id:
   *   post:
   *     description: Download file
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: fileId
   *         description: ID of file in XCloud
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Uploaded object
  */
  Router.get('/storage/file/:id', passportAuth, async function(req, res) {
    const user = req.user
    const fileIdInBucket = req.params.id
    let filePath;
    if (!user.mnemonic) {
      user.mnemonic = req.headers['internxt-mnemonic'];
    }
    Service.Files.Download(user, fileIdInBucket)
      .then(({ filestream, mimetype, downloadFile }) => {
        filePath = downloadFile;
        const fileName = downloadFile.split('/')[2];
        const extSeparatorPos = fileName.lastIndexOf('.')
        const fileNameNoExt = fileName.slice(0, extSeparatorPos)
        const fileExt = fileName.slice(extSeparatorPos + 1);
        const decryptedFileName = App.services.Crypt.decryptName(fileNameNoExt);

        res.setHeader('Content-type', mimetype);
        res.set('x-file-name', `${decryptedFileName}.${fileExt}`);
        filestream.pipe(res)
        fs.unlink(filePath, (error) => {
          if (error) throw error;
        });
      }).catch(({ message }) => {
        if (message === 'Bridge rate limit error') {
          res.status(402).json({ message })
          return;
        }
        res.status(500).json({ message })
      })
  })

  Router.delete('/storage/bucket/:bucketid/file/:fileid', passportAuth, function(req, res) {
    const user = req.user
    const bucketId = req.params.bucketid
    const fileIdInBucket = req.params.fileid
    if (!user.mnemonic) {
      user.mnemonic = req.headers['internxt-mnemonic'];
    }
    Service.Files.Delete(user, bucketId, fileIdInBucket)
      .then((result) => {
        res.status(200).json({ deleted: true })
      }).catch((err) => {
        Logger.error(err.message + '\n' + err.stack);
        res.status(500).json({ error: err.message })
      })
  })

  Router.get('/storage/file/search', function(req, res) {
    // TODO
  })

  return Router
}
