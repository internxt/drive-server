const speakeasy = require('speakeasy');
const openpgp = require('openpgp');
const ActivationRoutes = require('./activation');
const StorageRoutes = require('./storage');
const BridgeRoutes = require('./bridge');
const StripeRoutes = require('./stripe');
const DesktopRoutes = require('./desktop');
const MobileRoutes = require('./mobile');
const TwoFactorRoutes = require('./twofactor');
const AppSumoRoutes = require('./appsumo');
const PlanRoutes = require('./plan');
const PhotosRoutes = require('./photos');
const ShareRoutes = require('./share');
const BackupsRoutes = require('./backup');
const GuestRoutes = require('./guest');
const GatewayRoutes = require('./gateway');
const UsersReferralsRoutes = require('./users-referrals');
const NewsletterRoutes = require('./newsletter');

const passport = require('../middleware/passport');
const TeamsRoutes = require('./teams');
const logger = require('../../lib/logger');
const ReCaptchaV3 = require('../../lib/recaptcha');

const { passportAuth } = passport;

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
  // Teams routes
  TeamsRoutes(Router, Service, App);
  // AppSumo routes
  AppSumoRoutes(Router, Service, App);
  // Plan routes
  PlanRoutes(Router, Service, App);
  // Routes used by Internxt Photos
  PhotosRoutes(Router, Service, App);
  // Routes used by Internxt Photos
  ShareRoutes(Router, Service, App);
  // Routes used by Desktop Backups
  BackupsRoutes(Router, Service, App);
  // Invite guest routes
  GuestRoutes(Router, Service, App);
  // Gateway comunication
  GatewayRoutes(Router, Service, App);
  UsersReferralsRoutes(Router, Service, App);
  NewsletterRoutes(Router, Service, App);

  Router.post('/login', (req, res) => {
    if (!req.body.email) {
      return res.status(400).send({ error: 'No email address specified' });
    }

    try {
      req.body.email = req.body.email.toLowerCase();
    } catch (e) {
      return res.status(400).send({ error: 'Invalid username' });
    }

    // Call user service to find user
    return Service.User.FindUserByEmail(req.body.email).then((userData) => {
      const encSalt = App.services.Crypt.encryptText(userData.hKey.toString());
      const required2FA = userData.secret_2FA && userData.secret_2FA.length > 0;
      return Service.KeyServer.keysExists(userData).then((keyExist) => {
        res.status(200).send({ hasKeys: keyExist, sKey: encSalt, tfa: required2FA });
      });
    }).catch(() => {
      res.status(401).send({ error: 'Wrong email/password' });
    });
  });

  Router.post('/access', (req, res) => {
    const MAX_LOGIN_FAIL_ATTEMPTS = 10;

    // Call user service to find or create user
    Service.User.FindUserByEmail(req.body.email).then(async (userData) => {
      if (userData.errorLoginCount >= MAX_LOGIN_FAIL_ATTEMPTS) {
        return res.status(500).send({ error: 'Your account has been blocked for security reasons. Please reach out to us' });
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
        return res.status(400).send({ error: 'Wrong 2-factor auth code' });
      }

      if (pass === userData.password.toString() && tfaResult) {
        // Successfull login
        const internxtClient = req.headers['internxt-client'];
        const token = passport.Sign(userData.email, App.config.get('secrets').JWT, internxtClient === 'drive-web');

        Service.User.LoginFailed(req.body.email, false);
        Service.User.UpdateAccountActivity(req.body.email);
        const userBucket = await Service.User.GetUserBucket(userData);

        const keyExists = await Service.KeyServer.keysExists(userData);

        if (!keyExists && req.body.publicKey) {
          await Service.KeyServer.addKeysLogin(userData, req.body.publicKey, req.body.privateKey, req.body.revocateKey);
        }

        const keys = await Service.KeyServer.getKeys(userData);
        const hasTeams = !!(await Service.Team.getTeamByMember(req.body.email));
        let appSumoDetails = null;

        appSumoDetails = await Service.AppSumo.GetDetails(userData).catch(() => null);

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
          registerCompleted: userData.registerCompleted,
          teams: hasTeams,
          username: userData.username,
          bridgeUser: userData.bridgeUser,
          sharedWorkspace: userData.sharedWorkspace,
          appSumoDetails: appSumoDetails || null,
          backupsBucket: userData.backupsBucket
        };

        const userTeam = null;
        if (userTeam) {
          const tokenTeam = passport.Sign(userTeam.bridge_user, App.config.get('secrets').JWT, internxtClient === 'drive-web');
          return res.status(200).json({
            user, token, userTeam, tokenTeam
          });
        }
        return res.status(200).json({ user, token, userTeam });
      }
      // Wrong password
      if (pass !== userData.password.toString()) {
        Service.User.LoginFailed(req.body.email, true);
      }

      return res.status(401).json({ error: 'Wrong email/password' });
    }).catch((err) => {
      Logger.error('ERROR access %s, reason: %s', req.body.email, err.message);
      return res.status(401).send({ error: 'Wrong email/password' });
    });
  });

  Router.get('/user/refresh', passportAuth, async (req, res) => {
    const userData = req.user;

    const keyExists = await Service.KeyServer.keysExists(userData);

    if (!keyExists && req.body.publicKey) {
      await Service.KeyServer.addKeysLogin(userData, req.body.publicKey, req.body.privateKey, req.body.revocateKey);
    }

    const keys = await Service.KeyServer.getKeys(userData);
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

  Router.post('/register', async (req, res) => {
    try {
      if (req.headers['internxt-client'] !== 'drive-mobile') {
        const ipaddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
        await ReCaptchaV3.verify(req.body.captcha, ipaddress);
      }
    } catch (err) {
      return res.status(400).send({ error: 'Only humans allowed' });
    }

    return Service.User.RegisterUser(req.body)
      .then((result) => {
        if (req.body.referrer) {
          Logger.warn('Register for %s by referrer %s', result.user.email, req.body.referrer);
          return Service.AppSumo.ApplyLicense(result.user, req.body.referrer).then(() => result);
        }
        return result;
      })
      .then((result) => {
        res.status(200).send(result);
      })
      .catch((err) => {
        res.status(400).send({
          error: err.message,
          message: err.message
        });
        Logger.error('Error in register %s', req.body.email);
        Logger.error(err);
      });
  });

  Router.post('/initialize', (req, res) => {
    // Call user service to find or create user
    Service.User.InitializeUser(req.body).then(async (userData) => {
      // Process user data and answer API call
      if (userData.root_folder_id) {
        // Successfull initialization
        const user = {
          email: userData.email,
          bucket: userData.bucket,
          mnemonic: userData.mnemonic,
          root_folder_id: userData.root_folder_id
        };

        try {
          (await Service.Folder.Create(userData, 'Family', user.root_folder_id)).save();
          (await Service.Folder.Create(userData, 'Personal', user.root_folder_id)).save();
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

  Router.patch('/user/recover', passportAuth, (req, res) => {
    const newPassword = App.services.Crypt.decryptText(req.body.password);
    const newSalt = App.services.Crypt.decryptText(req.body.salt);

    // Old data, but re-encrypted
    const { mnemonic: oldMnemonic, privateKey: oldPrivateKey } = req.body;

    Service.User.recoverPassword(req.user, newPassword, newSalt, oldMnemonic, oldPrivateKey).then(() => {
      res.status(200).send({});
    }).catch(() => {
      res.status(500).send({ error: 'Could not restore password' });
    });
  });

  Router.patch('/user/keys', passportAuth, (req, res) => {
    Service.User.updateKeys(req.user, req.body).then(() => {
      res.status(200).send({});
    }).catch((err) => {
      res.status(500).send({ error: err.message });
    });
  });

  Router.get('/user/credit', passportAuth, (req, res) => {
    const { user } = req;
    return res.status(200).send({ userCredit: user.credit });
  });

  Router.get('/user/keys/:email', passportAuth, async (req, res) => {
    const { email } = req.params;

    const user = await Service.User.FindUserByEmail(email).catch(() => null);

    if (user) {
      const existsKeys = await Service.KeyServer.keysExists(user);
      if (existsKeys) {
        const keys = await Service.KeyServer.getKeys(user);
        res.status(200).send({ publicKey: keys.public_key });
      } else {
        res.status(400).send({ error: 'This user cannot be invited' });
      }
    } else {
      const { publicKeyArmored } = await openpgp.generateKey({
        userIDs: [{ email: 'inxt@inxt.com' }],
        curve: 'ed25519'
      });
      const codpublicKey = Buffer.from(publicKeyArmored).toString('base64');
      res.status(200).send({ publicKey: codpublicKey });
    }
  });

  return Router;
};
