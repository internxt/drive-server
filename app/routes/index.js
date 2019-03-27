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
  Router.get('/api-docs.json', function (req, res) {
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
          const pass = App.services.Crypt.decryptText(req.body.password);
          const hashObj = App.services.Crypt.passToHash({ password: pass, salt: userData.hKey });

          if (hashObj.hash == userData.password) {
            // Successfull login
            const token = jwt.sign(userData.email, App.config.get('secrets').JWT);
            res.status(200).json({
              user: {
                userId: userData.userId,
                mnemonic: userData.mnemonic,
                root_folder_id: userData.root_folder_id,
                storeMnemonic: userData.storeMnemonic
              },
              token
            });
          } else {
            // Wrong password
            res.status(400).json({ message: 'Wrong email/password' });
          }
        } else {
          // User not found
          res.status(400).json({ message: 'Wrong email/password' });
        }
      }).catch((err) => {
        Logger.error(err.message + '\n' + err.stack);
        res.send(err.message);
      })
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
    // Data validation for process only request with all data
    if (req.body.email && req.body.password) {
      // Call user service to find or create user
      Service.User.FindOrCreate(req.body).then((userData) => {
        // Process user data and answer API call
        if (userData.isCreated) {
          // Successfull register
          const token = jwt.sign(userData.email, App.config.get('secrets').JWT);
          const user = { email: userData.email }
          res.status(200).send({ token, user });
        } else {
          // This account already exists
          res.status(400).send({ message: 'This account already exists' });
        }
      }).catch((err) => {
        Logger.error(err.message + '\n' + err.stack);
        res.send(err.message);
      })
    }
    else {
      res.status(400).send({ message: 'You must provide registration data' });
    }
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
  Router.post('/initialize', function (req, res) {
    // Call user service to find or create user
    Service.User.InitializeUser(req.body)
      .then((userData) => {
        // Process user data and answer API call
        if (userData.root_folder_id) {
          // Successfull initialization
          const user = { email: userData.email, mnemonic: userData.mnemonic, root_folder_id: userData.root_folder_id }
          res.status(200).send({ user });
        } else {
          // User initialization unsuccessfull
          res.status(400).send({ message: "Your account can't be initialized" });
        }
      }).catch((err) => {
        Logger.error(err.message + '\n' + err.stack);
        res.send(err.message);
      })
  });

  Router.post('/buy', function (req, res) {
    const axios = require('axios');
    const crypto = require('crypto')

    var fullToken = req.body.token;

    var fullTokenJson = JSON.parse(fullToken);
    var user = fullTokenJson.email;
    var planToSubscribe = req.body.plan;


    Service.User.FindUserByEmail(user).then(userData => {

      console.log('USER FOUND', userData);

      let pwd = userData.userId;
      let pwdHash = crypto.createHash('sha256').update(pwd).digest('hex');
      let credential = Buffer.from(userData.email + ':' + pwdHash).toString('base64');

      console.log('CREDENTIAL: ', credential);

      let endpoint = App.config.get('STORJ_BRIDGE') + '/subscription';

      console.log(endpoint);


      axios.post(App.config.get('STORJ_BRIDGE') + '/subscription',
      {
        plan_id: planToSubscribe,
        token: fullToken
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + credential
        }
      }).then(data => {
        console.log('AXIOS REQUEST: ', data);
        console.log(data);
        res.status(200).send({ message: 'Purchased OK' });
      }).catch(err => {
        if (err.response.data.error) {
          res.status(400).send({ message: err.response.data.error });
        }
        else {
          res.status(400).send({ message: 'Purchase failed: Connection error on bridge' });
        }
      });

    }).catch(err => {
      console.log(err);
      res.status(400).send({ message: 'Error purchasing: User not found' });
    });

  });


  Router.post('/plans', function (req, res) {
    let x = Service.Plan.ListAll().then(data => {
      res.status(200).json(data);
    }).catch(e => {
      res.status(400).json({ message: 'Error retrieving list of plans' });
    });
  });

  Router.post('/usage', function (req, res) {

    const axios = require('axios');
    const crypto = require('crypto')

    Service.User.FindUserByEmail(req.body.email)
      .then(userData => {

        let pwd = userData.userId;
        let pwdHash = crypto.createHash('sha256').update(pwd).digest('hex');

        let credential = Buffer.from(userData.email + ':' + pwdHash).toString('base64');

        axios.get(App.config.get('STORJ_BRIDGE') + '/usage', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + credential
          }
        }).then(data => {
          res.status(200).send(data.data);

        }).catch(err => {
          res.status(400).send({ result: 'Error retrieving bridge information' });

        });

      }).catch(err => {
        res.status(400).send({ result: 'Error retrieving user info' });
      });
  });

  Router.post('/limit', function (req, res) {

    const axios = require('axios');
    const crypto = require('crypto')

    Service.User.FindUserByEmail(req.body.email)
      .then(userData => {

        let pwd = userData.userId;
        let pwdHash = crypto.createHash('sha256').update(pwd).digest('hex');

        let credential = Buffer.from(userData.email + ':' + pwdHash).toString('base64');

        axios.get(App.config.get('STORJ_BRIDGE') + '/limit', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + credential
          }
        }).then(data => {
          res.status(200).send(data.data);
        }).catch(err => {
          res.status(400).send({ result: 'Error retrieving bridge information' });
        });

      }).catch(err => {
        res.status(400).send({ result: 'Error retrieving user info' });
      });
  });

  Router.put('/auth/mnemonic', function (req, res) {
    const {
      body: { email, mnemonic },
    } = req;
    Service.User.UpdateMnemonic(email, mnemonic)
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
  Router.get('/users/:id', passportAuth, function (req, res) {
    Service.User.GetUserById(req.params.id).then(function (foundUser) {
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
  Router.get('/storage/folder/:id', passportAuth, function (req, res) {
    const folderId = req.params.id;
    Service.Folder.GetContent(folderId, req.user.dataValues.email)
      .then((result) => {
        res.status(200).json(result)
      }).catch((err) => {
        Logger.error(err.message + '\n' + err.stack);
        res.status(500).json(err)
      });
  });

  Router.get('/storage/folder/:id/meta', function (req, res) {
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
  Router.post('/storage/folder', passportAuth, async function (req, res) {
    const folderName = req.body.folderName
    const parentFolderId = req.body.parentFolderId
    const user = req.user
    user.mnemonic = req.headers['internxt-mnemonic'];

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
  Router.delete('/storage/folder/:id', passportAuth, async function (req, res) {
    const user = req.user
    // Set mnemonic to decrypted mnemonic
    user.mnemonic = req.headers['internxt-mnemonic'];
    const folderId = req.params.id

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
  Router.post('/storage/folder/:id/upload', passportAuth, upload.single('xfile'), async function (req, res) {
    const user = req.user
    // Set mnemonic to decrypted mnemonic
    user.mnemonic = req.headers['internxt-mnemonic'];
    const xfile = req.file
    const folderId = req.params.id

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
   * /storage/file:
   *   post:
   *     description: Create file on DB for local upload
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: file
   *         description: file object with properties
   *         in: body
   *         required: true
   *     responses:
   *       200:
   *         description: File created successfully
   *       400:
   *         description: Bad request. Any data is not passed on request.
   */
  Router.post('/storage/file', passportAuth, async function(req, res) {
    const file = req.body.file;
    Service.Files.CreateFile(file)
      .then((result) => {
        res.status(200).json(result);
      }).catch((error) => {
        res.status(400).json({ message: error.message });
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
  Router.get('/storage/file/:id', passportAuth, async function (req, res) {
    const user = req.user
    // Set mnemonic to decrypted mnemonic
    user.mnemonic = req.headers['internxt-mnemonic'];
    const fileIdInBucket = req.params.id
    let filePath;

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

  Router.delete('/storage/bucket/:bucketid/file/:fileid', passportAuth, function (req, res) {
    const user = req.user
    // Set mnemonic to decrypted mnemonic
    user.mnemonic = req.headers['internxt-mnemonic'];
    const bucketId = req.params.bucketid
    const fileIdInBucket = req.params.fileid

    Service.Files.Delete(user, bucketId, fileIdInBucket)
      .then((result) => {
        res.status(200).json({ deleted: true })
      }).catch((err) => {
        Logger.error(err.stack);
        res.status(500).json({ error: err.message })
      })
  })

  Router.get('/user/isactivated', passportAuth, function (req, res) {
    Service.Storj.IsUserActivated(req.headers['xemail']).then((response) => {
      if (response.data) {
        res.status(200).send({ activated: response.data.activated })
      } else {
        res.status(400).send({ error: 'User activation info not found' })
      }
    }).catch((error) => {
      Logger.error(error.stack)
      res.status(500).json({ error: error.message })
    })
  })

  Router.post('/user/storeOption', passportAuth, function (req, res) {
    Service.User.UpdateStorageOption(req.body.email, req.body.option).then((response) => {
      res.status(200).json({ mnemonic: response.mnemonic })
    }).catch((error) => {
      res.status(500).json({ error: error.message })
    })
  })

  Router.get('/captcha/:token', function (req, res) {
    Service.User.resolveCaptcha(req.params.token)
      .then((response) => {
        res.status(200).json(response);
      }).catch((error) => {
        Logger.error(error.stack);
        res.status(500);
      })
  })

  Router.get('/storage/file/search', function (req, res) {
    // TODO
  });

  Router.get('/usage', function (req, res) {

  });

  return Router
}
