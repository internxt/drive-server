const passport = require('../middleware/passport');
const Logger = require('../../lib/logger').default;

const { passportAuth } = passport;

module.exports = (Router, Service) => {
  const logger = Logger.getInstance();

  Router.post('/newsletter/subscribe', passportAuth, async (req, res) => {
    const { email } = req.body;
    const { user } = req;
    const mailerLiteGroupId = '51650193869768251';

    try {
      await Service.Newsletter.subscribe(email, mailerLiteGroupId);

      await Service.UsersReferrals.applyUserReferral(user.id, 'subscribe-to-newsletter');

      res.status(200).send({ message: 'Subscribed to newsletter!' });
    } catch (err) {
      const errMessage = `Error subscribing to newsletter email '${email}': ${err}`;

      logger.error(errMessage);
      res.status(400).send({ error: errMessage });
    }
  });
};
