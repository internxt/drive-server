const sgMail = require('@sendgrid/mail');
const speakeasy = require('speakeasy');
const uuid = require('uuid');
const Analytics = require('analytics-node');

const analytics = new Analytics(process.env.APP_SEGMENT_KEY);

const openpgp = require('openpgp');
const ActivationRoutes = require('./activation');
const StorageRoutes = require('./storage');
const BridgeRoutes = require('./bridge');
const StripeRoutes = require('./stripe');
const DesktopRoutes = require('./desktop');
const MobileRoutes = require('./mobile');
const TwoFactorRoutes = require('./twofactor');
const ExtraRoutes = require('./extra');
const PhotosRoutes = require('./photos');
const AppSumoRoutes = require('./appsumo');

const passport = require('../middleware/passport');
const TeamsRoutes = require('./teams');
const logger = require('../../lib/logger');

const { passportAuth } = passport;
const userTeam = null;

const Logger = logger.getInstance();

module.exports = (Router, Service, App) => {
  // User account activation/deactivation
  ActivationRoutes(Router, Service, App);
  // Files/folders operations
  StorageRoutes(Router, Service, App);
  // Calls to the BRIDGE api
  BridgeRoutes(Router, Service, App);
  // Calls to STRIPE api
  StripeRoutes(Router, Service, App);
  // Routes used by X-Cloud-Desktop
  DesktopRoutes(Router, Service, App);
  // Routes used by X-Cloud-Mobile
  MobileRoutes(Router, Service, App);
  // Routes to create, edit and delete the 2-factor-authentication
  TwoFactorRoutes(Router, Service, App);
  // Extra routes uncategorized
  ExtraRoutes(Router, Service, App);

  TeamsRoutes(Router, Service, App);
  // Routes used by Internxt Photos
  PhotosRoutes(Router, Service, App);



  AppSumoRoutes(Router, Service, App);

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
  Router.post('/login', (req, res) => {
    if (!req.body.email) {
      return res.status(400).send({ error: 'No email address specified' });
    }

    try {
      req.body.email = req.body.email.toLowerCase();
    } catch {
      return res.status(400).send({ error: 'Invalid username' })
    }

    // Call user service to find user
    return Service.User.FindUserByEmail(req.body.email).then((userData) => {
      if (!userData) {
        // Wrong user
        return res.status(400).json({ error: 'Wrong email/password' });
      }

      return Service.Storj.IsUserActivated(req.body.email).then((resActivation) => {
        if (!resActivation.data.activated) {
          res.status(400).send({ error: 'User is not activated' });
        } else {
          const encSalt = App.services.Crypt.encryptText(userData.hKey.toString());
          const required2FA = userData.secret_2FA && userData.secret_2FA.length > 0;
          Service.Keyserver.keysExists(userData).then(() => {
            res.status(200).send({ hasKeys: true, sKey: encSalt, tfa: required2FA });
          }).catch(() => {
            res.status(200).send({ hasKeys: false, sKey: encSalt, tfa: required2FA });
          });
        }
      }).catch((err) => {
        res.status(400).send({
          error: 'User not found on Bridge database',
          message: err.response ? err.response.data : err
        });
      });
    }).catch((err) => {
      Logger.error(`${err}: ${req.body.email}`);
      res.status(400).send({
        error: 'User not found on Cloud database',
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
  Router.post('/access', (req, res) => {
    const MAX_LOGIN_FAIL_ATTEMPTS = 5;

    // Call user service to find or create user
    Service.User.FindUserByEmail(req.body.email).then(async (userData) => {
      if (userData.errorLoginCount >= MAX_LOGIN_FAIL_ATTEMPTS) {
        res.status(500).send({ error: 'Your account has been blocked for security reasons. Please reach out to us' });
        return;
      }

      // Process user data and answer API call
      const pass = App.services.Crypt.decryptText(req.body.password);
      // 2-Factor Auth. Verification
      const needsTfa = userData.secret_2FA && userData.secret_2FA.length > 0;
      let tfaResult = true;
      if (needsTfa) {
        tfaResult = speakeasy.totp.verifyDelta({
          secret: userData.secret_2FA,
          token: req.body.tfa,
          encoding: 'base32',
          window: 2
        });
      }
      if (!tfaResult) {
        res.status(400).send({ error: 'Wrong 2-factor auth code' });
      } else if (pass === userData.password.toString() && tfaResult) {
        // Successfull login
        const internxtClient = req.headers['internxt-client'];
        const token = passport.Sign(userData.email,
          App.config.get('secrets').JWT,
          internxtClient === 'x-cloud-web' || internxtClient === 'drive-web');

        Service.User.LoginFailed(req.body.email, false);
        Service.User.UpdateAccountActivity(req.body.email);
        const userBucket = await Service.User.GetUserBucket(userData);

        let teamRol = '';
        if (userTeam && userTeam.admin === req.body.email) {
          teamRol = 'admin';
        } else if (userTeam) {
          teamRol = 'member';
        }

        let keys = false;
        try {
          keys = await Service.Keyserver.keysExists(userData);
        } catch (e) {
          // no op
        }

        if (!keys && req.body.publicKey) {
          await Service.Keyserver.addKeysLogin(userData, req.body.publicKey, req.body.privateKey, req.body.revocateKey);
          keys = await Service.Keyserver.keysExists(userData);
        }

        const user = {
          email: req.body.email,
          userId: userData.userId,
          mnemonic: userData.mnemonic,
          root_folder_id: userData.root_folder_id,
          name: userData.name,
          lastname: userData.lastname,
          uuid: userData.uuid,
          credit: userData.credit,
          createdAt: userData.createdAt,
          privateKey: keys ? keys.private_key : null,
          publicKey: keys ? keys.public_key : null,
          revocateKey: keys ? keys.revocation_key : null,
          bucket: userBucket,
          registerCompleted: userData.registerCompleted
        };

        if (userTeam) {
          const tokenTeam = passport.Sign(userTeam.bridge_user, App.config.get('secrets').JWT,
            internxtClient === 'x-cloud-web' || internxtClient === 'drive-web');
          res.status(200).json({
            user, token, userTeam, teamRol, tokenTeam
          });
        } else {
          res.status(200).json({
            user, token, userTeam, teamRol
          });
        }
      } else {
        // Wrong password
        if (pass !== userData.password.toString()) {
          Service.User.LoginFailed(req.body.email, true);
        }

        res.status(400).json({ error: 'Wrong email/password' });
      }
    }).catch((err) => {
      Logger.error(`${err.message}\n${err.stack}`);
      res.status(400).send({ error: 'User not found on Cloud database', message: err.message });
    });
  });

  Router.get('/user/refresh', passportAuth, async (req, res) => {
    const userData = req.user;
    let keys = false;
    try {
      keys = await Service.Keyserver.keysExists(userData);
    } catch (e) {
      // no op
    }
    if (!keys && req.body.publicKey) {
      await Service.Keyserver.addKeysLogin(userData, req.body.publicKey, req.body.privateKey, req.body.revocateKey);
      keys = await Service.Keyserver.keysExists(userData);
    }
    const userBucket = await Service.User.GetUserBucket(userData);

    const internxtClient = req.headers['internxt-client'];
    const token = passport.Sign(userData.email,
      App.config.get('secrets').JWT,
      internxtClient === 'x-cloud-web' || internxtClient === 'drive-web');

    const user = {
      userId: userData.userId,
      mnemonic: userData.mnemonic,
      root_folder_id: userData.root_folder_id,
      name: userData.name,
      lastname: userData.lastname,
      uuid: userData.uuid,
      credit: userData.credit,
      createdAt: userData.createdAt,
      privateKey: keys ? keys.private_key : null,
      publicKey: keys ? keys.public_key : null,
      revocateKey: keys ? keys.revocation_key : null,
      bucket: userBucket
    };
    res.status(200).json({
      user, token
    });
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
  Router.post('/register', async (req, res) => {
    // Data validation for process only request with all data
    if (req.body.email && req.body.password) {
      req.body.email = req.body.email.toLowerCase().trim();
      Logger.warn('Register request for %s from %s', req.body.email, req.headers['X-Forwarded-For']);

      const newUser = req.body;
      newUser.credit = 0;

      const { referral } = req.body;

      let hasReferral = false;
      let referrer = null;

      if (uuid.validate(referral)) {
        await Service.User.FindUserByUuid(referral).then((userData) => {
          if (userData === null) {
            // Don't exists referral user
          } else {
            newUser.credit = 5;
            hasReferral = true;
            referrer = userData;
            Service.User.UpdateCredit(referral);
          }
        });
      }

      // Call user service to find or create user
      Service.User.FindOrCreate(newUser).then((userData) => {
        // Process user data and answer API call
        if (userData.isNewRecord) {
          if (hasReferral) {
            Service.Analytics.identify({
              userId: userData.uuid,
              traits: { referred_by: referrer.uuid }
            });
          }

          // Successfull register
          const token = passport.Sign(userData.email, App.config.get('secrets').JWT);

          const user = {
            userId: userData.userId,
            mnemonic: userData.mnemonic,
            root_folder_id: userData.root_folder_id,
            name: userData.name,
            lastname: userData.lastname,
            uuid: userData.uuid,
            credit: userData.credit,
            createdAt: userData.createdAt,
            registerCompleted: userData.registerCompleted,
            email: userData.email
          };

          res.status(200).send({ token, user, uuid: userData.uuid });
        } else {
          // This account already exists
          res.status(400).send({ message: 'This account already exists' });
        }
      }).catch((err) => {
        Logger.error(`${err.message}\n${err.stack}`);
        res.status(500).send({ message: err.message });
      });
    } else {
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
  Router.post('/initialize', (req, res) => {
    // Call user service to find or create user
    Service.User.InitializeUser(req.body).then(async (userData) => {
      // Process user data and answer API call
      if (userData.root_folder_id) {
        // Successfull initialization
        const user = {
          email: userData.email,
          mnemonic: userData.mnemonic,
          root_folder_id: userData.root_folder_id
        };

        try {
          const familyFolder = await Service.Folder.Create(userData, 'Family', user.root_folder_id);
          const personalFolder = await Service.Folder.Create(userData, 'Personal', user.root_folder_id);
          personalFolder.iconId = 1;
          personalFolder.color = 'pink';
          familyFolder.iconId = 18;
          familyFolder.color = 'yellow';
          await personalFolder.save();
          await familyFolder.save();
        } catch (e) {
          Logger.error('Cannot initialize welcome folders: %s', e.message);
        } finally {
          res.status(200).send({ user });
        }
      } else {
        // User initialization unsuccessful
        res.status(400).send({ message: 'Your account can\'t be initialized' });
      }
    }).catch((err) => {
      Logger.error(`${err.message}\n${err.stack}`);
      res.send(err.message);
    });
  });

  Router.patch('/user/password', passportAuth, (req, res) => {
    const currentPassword = App.services.Crypt.decryptText(req.body.currentPassword);
    const newPassword = App.services.Crypt.decryptText(req.body.newPassword);
    const newSalt = App.services.Crypt.decryptText(req.body.newSalt);
    const { mnemonic, privateKey } = req.body;

    Service.User.UpdatePasswordMnemonic(req.user, currentPassword, newPassword, newSalt, mnemonic, privateKey).then(() => {
      res.status(200).send({});
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });

  Router.post('/user/claim', passportAuth, (req, res) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: 'hello@internxt.com',
      from: 'hello@internxt.com',
      subject: 'New credit request',
      text: `Hello Internxt! I am ready to receive my credit for referring friends. My email is ${req.user.email}`
    };
    if (req.user.credit > 0) {
      analytics.track({ userId: req.user.uuid, event: 'user-referral-claim', properties: { credit: req.user.credit } });
      sgMail
        .send(msg).then(() => {
          res.status(200).send({});
        }).catch((err) => {
          res.status(500).send(err);
        });
    } else {
      res.status(500).send({ error: 'No credit' });
    }
  });

  Router.post('/user/invite', passportAuth, (req, res) => {
    const { email } = req.body;

    Service.User.FindUserObjByEmail(email).then((user) => {
      if (user === null) {
        Service.Mail.sendInvitationMail(email, req.user).then(() => {
          Logger.info('Usuario %s envia invitación a %s', req.user.email, req.body.email);
          res.status(200).send({});
        }).catch(() => {
          Logger.error('Error: Send mail from %s to %s', req.user.email, req.body.email);
          res.status(200).send({});
        });
      } else {
        Logger.warn('Error: Send mail from %s to %s, already registered', req.user.email, req.body.email);
        res.status(200).send({});
      }
    }).catch((err) => {
      Logger.error('Error: Send mail from %s to %s, SMTP error', req.user.email, req.body.email, err.message);
      res.status(200).send({});
    });
  });

  Router.get('/user/credit', passportAuth, (req, res) => {
    const { user } = req;
    return res.status(200).send({ userCredit: user.credit });
  });

  /**
    * @swagger
    * /user/keys/:user:
    *   get:
    *     description: check that the invited user has public passwords .
    *     produces:
    *       - application/json
    *     parameters:
    *       - description: user object all info
    *         in: url
    *         required: true
    *     responses:
    *       200:
    *         description: Successfull get public keys
    *       204:
    *         description: User not has keys
    *      additional info:
    *        If the user does not have a public key he will send a random one for security, this
    *        is used in web for invitations
    */
  Router.get('/user/keys/:user', passportAuth, async (req, res) => {
    const { user } = req.params;
    Service.User.FindUserByEmail(user).then((userKeys) => {
      Service.Keyserver.keysExists(userKeys).then((keys) => {
        res.status(200).send({ publicKey: keys.public_key });
      }).catch(async () => {
        const { publicKeyArmored } = await openpgp.generateKey({
          userIds: [{ email: 'inxt@inxt.com' }],
          curve: 'ed25519'
        });
        const codpublicKey = Buffer.from(publicKeyArmored).toString('base64');
        res.status(200).send({ publicKey: codpublicKey });
        Logger.error('Error: The user not have keys');
        res.status(500).send({});
      });
    }).catch(() => {
      res.status(500).send({});
    });
  });

  return Router;
};
