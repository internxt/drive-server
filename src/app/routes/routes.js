const speakeasy = require('speakeasy');

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
const UsersReferralsRoutes = require('./usersReferrals');
const NewsletterRoutes = require('./newsletter');
const UserRoutes = require('./user');

const passport = require('../middleware/passport');
const TeamsRoutes = require('./teams');
const logger = require('../../lib/logger').default;
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
  UserRoutes(Router, Service, App);

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

        appSumoDetails = await Service.AppSumo.GetDetails(userData.id).catch(() => null);

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
          hasReferralsProgram: await Service.UsersReferrals.hasReferralsProgram(req.body.email, userData.userId),
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
    const { publicKey, privateKey, revocateKey } = req.body;
    const userData = req.user;

    const keyExists = await Service.KeyServer.keysExists(userData);

    if (!keyExists && publicKey) {
      await Service.KeyServer.addKeysLogin(userData, publicKey, privateKey, revocateKey);
    }

    const keys = await Service.KeyServer.getKeys(userData);
    const userBucket = await Service.User.GetUserBucket(userData);

    const internxtClient = req.headers['internxt-client'];
    const token = passport.Sign(userData.email,
      App.config.get('secrets').JWT,
      internxtClient === 'x-cloud-web' || internxtClient === 'drive-web');

    const hasTeams = !!(await Service.Team.getTeamByMember(userData.email));
    let appSumoDetails = null;

    appSumoDetails = await Service.AppSumo.GetDetails(userData.id).catch(() => null);

    const user = {
      email: userData.email,
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
      hasReferralsProgram: await Service.UsersReferrals.hasReferralsProgram(userData.email, userData.userId),
      backupsBucket: userData.backupsBucket
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

  return Router;
};
