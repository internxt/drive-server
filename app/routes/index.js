const jwt = require('jsonwebtoken');
const passport = require('passport')
const mime = require('mime');
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
   *     description: Unified Civic registrtion/login. User is registered or created.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: civictoken
   *         description: JWT token returned from Civic service
   *         in: header
   *         required: true
   *     responses:
   *       201:
   *         description: Created/Found user object
   */
  Router.get('/auth', function (req, res) {
    const civicClient = App.civic
    const jwtToken = req.headers.civictoken

    civicClient.exchangeCode(jwtToken)
      .then((userData) => {
        const id = userData.userId
        const email = userData.data[0].value
        Service.User.FindOrCreate({ id, email })
          .then((user) => {
            const token = jwt.sign(user.email, App.config.get('secrets').JWT);
            res.status(201).json({ user, token })
          }).catch((err) => {
            res.send(err.message)
          });
      }).catch((error) => {
        res.send(error.message)
      });
  });

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
    const folderId = req.params.id
    Service.Folder.GetContent(folderId)
      .then((result) => {
        res.status(200).json(result)
      }).catch((err) => {
        res.status(500).json(err)
      });
  });

  Router.get('/storage/folder/:id/meta', function(req, res) {
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
    Service.Folder.Create(user, folderName, parentFolderId)
      .then((result) => {
        res.status(201).json(result)
      }).catch((err) => {
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
    Service.Folder.Delete(user, folderId)
      .then((result) => {
        res.status(204).json(result)
      }).catch((err) => {
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
    Service.Files.Upload(user, folderId, xfile.originalname, xfile.path)
      .then((result) => {
        res.status(201).json(result)
      }).catch((err) => {
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
    Service.Files.Download(user, fileIdInBucket)
      .then((result) => {
        res.set('x-file-name', result.file.name);
        res.download(`${process.cwd()}/downloads/${result.file.name}`)
      }).catch((err) => {
        res.status(500).json(err.message)
      });
  })

  Router.delete('/storage/bucket/:bucketid/file/:fileid', passportAuth, function(req, res) {
    const user = req.user
    const bucketId = req.params.bucketid
    const fileIdInBucket = req.params.fileid
    Service.Files.Delete(user, bucketId, fileIdInBucket)
      .then((result) => {
        res.status(200).json({ deleted: true })
      }).catch((err) => {
        res.status(500).json({ error: err.message })
      })
  })

  Router.get('/storage/file/search', function(req, res) {
    const query = req.query.q
    // TODO
  })

  return Router
}
