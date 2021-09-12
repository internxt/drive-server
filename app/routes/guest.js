const bip39 = require('bip39');
const { passportAuth } = require('../middleware/passport');
const logger = require('../../lib/logger');

const Logger = logger.getInstance();

module.exports = (Router, Service) => {
  Router.post('/guest/invite', passportAuth, (req, res) => {
    const tempKey = bip39.mnemonicToSeedSync(req.headers['internxt-mnemonic']).toString('hex');
    const guestUser = req.body.guest && req.body.guest.toLowerCase();

    Logger.info('REQUEST GUEST from %s to %s with key %s', req.user.email, guestUser, tempKey);

    Service.Guest.enableShareWorkspace(req.user, guestUser, tempKey).then(() => {
      return Service.Mail.sendGuestInvitation(req.user, guestUser).then(() => {
        res.status(200).send({ ok: 1 });
      }).catch(err => {
        throw Error(err.message)
      })
    }).catch((err) => {
      res.status(500).send({ error: 1 });
      Logger.error(err);
    });
  });

  Router.post('/guest/accept', passportAuth, (req, res) => {
    Logger.info('ACCEPT INVITATION GUEST from %s - %s', req.user.email, JSON.stringify(req.body));
    res.status(200).send();
  })
};
