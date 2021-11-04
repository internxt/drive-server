const bip39 = require('bip39');
const AesUtil = require('../../lib/AesUtil');
const Logger = require('../../lib/logger').default;
const { passportAuth } = require('../middleware/passport');

module.exports = (Router, Service) => {
  const logger = Logger.getInstance();

  Router.post('/guest/invite', passportAuth, async (req, res) => {
    const sharedKey = req.headers['internxt-mnemonic'];

    if (!sharedKey) {
      return res.status(400).send({ error: 'Missing key' });
    }

    const sharedKeyEncrypted = AesUtil.encrypt(bip39.mnemonicToEntropy(sharedKey));

    const guestUser = req.body.guest && req.body.guest.toLowerCase();

    if (!guestUser) {
      return res.status(400).send({ error: 'Missing guest user' });
    }

    try {
      await Service.Guest.invite(req.user, guestUser, sharedKeyEncrypted);
      await Service.Mail.sendGuestInvitation(req.user, guestUser);

      return res.status(200).send({});
    } catch (err) {
      logger.error('Error inviting user. %s is inviting %s: %s', req.user.email, req.body.guest, err.message);

      return res.status(500).send({ error: err.message || 'Internal server error' });
    }
  });

  Router.post('/guest/accept', passportAuth, async (req, res) => {
    try {
      const { payload } = req.body;

      await Service.Guest.acceptInvitation(req.user, payload);
      return res.status(200).send({});
    } catch (err) {
      logger.error('Error accepting invitation for user %s: %s', req.user.email, err.message);

      return res.status(500).send({ error: err.message });
    }
  });
};
