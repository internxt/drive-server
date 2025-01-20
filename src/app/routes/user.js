const openpgp = require('openpgp');
const createHttpError = require('http-errors');
const { passportAuth, Sign, SignWithFutureIAT, SignNewTokenWithFutureIAT } = require('../middleware/passport');
const Logger = require('../../lib/logger').default;
const AnalyticsService = require('../../lib/analytics/AnalyticsService');
const { default: uploadAvatar } = require('../middleware/upload-avatar');

const logger = Logger.getInstance();

module.exports = (Router, Service, App) => {
  Router.patch('/user/password', passportAuth, (req, res) => {
    res.status(400).send({ error: 'Deprecated endpoint' });
  });

  Router.patch('/user/recover', passportAuth, (req, res) => {
    const newPassword = App.services.Crypt.decryptText(req.body.password);
    const newSalt = App.services.Crypt.decryptText(req.body.salt);

    // Old data, but re-encrypted
    const { mnemonic: oldMnemonic, privateKey: oldPrivateKey } = req.body;

    Service.User.recoverPassword(req.user, newPassword, newSalt, oldMnemonic, oldPrivateKey)
      .then(() => {
        res.status(200).send({});
      })
      .catch(() => {
        res.status(500).send({ error: 'Could not restore password' });
      });
  });

  Router.patch('/user/keys', passportAuth, (req, res) => {
    Service.User.updateKeys(req.user, req.body)
      .then(() => {
        res.status(200).send({});
      })
      .catch((err) => {
        res.status(500).send({ error: err.message });
      });
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
        curve: 'ed25519',
      });
      const codpublicKey = Buffer.from(publicKeyArmored).toString('base64');
      res.status(200).send({ publicKey: codpublicKey });
    }
  });

  Router.get('/user/resend/:email', (req, res) => {
    Service.User.ResendActivationEmail(req.params.email)
      .then(() => {
        res.status(200).send({ message: 'ok' });
      })
      .catch((err) => {
        logger.error('Resend activation email error %s', err ? err.message : err);
        res.status(500).send({
          error:
            err.response && err.response.data && err.response.data.error
              ? err.response.data.error
              : 'Internal server error',
        });
      });
  });

  Router.post('/user/invite', passportAuth, async (req, res) => {
    const inviteEmail = req.body.email;
    const { user } = req;
    const hostFullName = user.name && user.name + (user.lastname ? ` ${user.lastname}` : '');

    try {
      if (!inviteEmail) {
        throw createHttpError(400, 'You have to specify an email address');
      }

      if (inviteEmail === user.email) {
        throw createHttpError(400, 'You cannot invite yourself');
      }

      await Service.User.invite({
        inviteEmail,
        hostEmail: user.email,
        hostUserId: user.id,
        hostFullName,
        hostReferralCode: user.referralCode,
      });

      res.status(200).send({ message: `Internxt invitation sent to ${inviteEmail}` });

      AnalyticsService.trackInvitationSent(user.uuid, inviteEmail);
    } catch (err) {
      if (err instanceof Service.User.DailyInvitationUsersLimitReached) {
        return res.status(429).send(err.message);
      }

      throw err;
    }
  });

  Router.get('/user/invite', passportAuth, async (req, res) => {
    const { user } = req;

    const invites = await Service.User.getFriendInvites(user.id);

    res.status(200).send(invites);
  });

  Router.post('/activate/update', passportAuth, async (req, res) => {
    try {
      await Service.User.CompleteInfo(req.user, req.body);

      const userData = req.user;
      const token = Sign(userData.email, App.config.get('secrets').JWT, true);

      const user = {
        userId: userData.userId,
        mnemonic: userData.mnemonic.toString(),
        root_folder_id: userData.root_folder_id,
        name: userData.name,
        lastname: userData.lastname,
        uuid: userData.uuid,
        credit: userData.credit,
        createdAt: userData.createdAt,
        registerCompleted: userData.registerCompleted,
        email: userData.email,
        bridgeUser: userData.email,
        username: userData.email,
        appSumoDetails: null,
      };

      res.status(200).send({ token, user });
    } catch (err) {
      logger.error(
        'Update user error %s: %s. STACK %s. BODY %s',
        req.user.email,
        err.message,
        err.stack || 'NO STACK',
        req.body
      );
      res.status(500).send({ error: 'Internal Server error' });
    }
  });

  Router.patch('/user/profile', passportAuth, (req, res) => {
    if (typeof req.body !== 'object') {
      res.status(400).send({ error: 'Request has no body' });
    }

    Service.User.modifyProfile(req.user.email, req.body)
      .then(() => {
        res.status(200).end();
      })
      .catch((err) => {
        logger.error('Error during profile update for user %s: %s', req.user.email, err.message);
        res.status(500).send({ error: err.message });
      });
  });

  Router.put('/user/avatar', passportAuth, uploadAvatar, async (req, res) => {
    const { user } = req;
    if (!req.file) res.status(400).send({ error: 'Avatar field is required' });

    const response = await Service.User.upsertAvatar(user, req.file.key);

    res.status(200).send(response);
  });

  Router.delete('/user/avatar', passportAuth, async (req, res) => {
    const { user } = req;

    await Service.User.deleteAvatar(user);

    res.status(200).end();
  });

  Router.post('/user/sendVerificationEmail', passportAuth, async (req, res) => {
    const { user } = req;

    try {
      await Service.User.sendEmailVerification(user);

      res.status(201).end();
    } catch (err) {
      logger.error(
        `[USER/VERIFICATION-EMAIL]: Error for user ${user.uuid}: ${err.message}. ${err.stack | 'NO STACK.'}`
      );
      res.status(500).send();
    }
  });

  Router.post('/user/verifyEmail', async (req, res) => {
    const { verificationToken } = req.body;

    if (!verificationToken) return res.status(400).send({ error: 'There is no verification token to validate' });

    await Service.User.verifyEmail(verificationToken);

    res.status(201).end();
  });
};
