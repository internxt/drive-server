const openpgp = require('openpgp');

const createHttpError = require('http-errors');
const { passportAuth } = require('../middleware/passport');
const logger = require('../../lib/logger');
const AnalyticsService = require('../services/analytics');

const Logger = logger.getInstance();

module.exports = (Router, Service, App) => {
  const analytics = AnalyticsService();

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

  Router.get('/user/resend/:email', (req, res) => {
    Service.User.ResendActivationEmail(req.params.email).then(() => {
      res.status(200).send({ message: 'ok' });
    }).catch((err) => {
      Logger.error('Resend activation email error %s', err ? err.message : err);
      res.status(500).send({
        error:
          err.response && err.response.data && err.response.data.error
            ? err.response.data.error
            : 'Internal server error'
      });
    });
  });

  Router.post('/user/invite', passportAuth, async (req, res) => {
    const inviteEmail = req.body.email;
    const { user } = req;
    const hostFullName = user.name && (user.name + (user.lastname ? ` ${user.lastname}` : ''));

    try {
      if (!inviteEmail) {
        throw createHttpError(400, 'You have to specify an email address');
      }

      if (inviteEmail === user.email) {
        throw createHttpError(400, 'You cannot invite yourself');
      }

      await Service.User.invite({
        inviteEmail, hostEmail: user.email, hostFullName, hostReferralCode: user.referralCode
      });

      analytics.track({
        userId: user.uuid,
        event: 'Invitation Sent',
        properties: { sent_to: inviteEmail }
      });

      res.status(200).send({ message: `Internxt invitation sent to ${inviteEmail}` });
    } catch (err) {
      Logger.error('Invite user error: %s', err ? err.message : err);
      res.status((err && err.status) || 500).send({
        error: err ? err.message : err
      });
    }
  });
};
