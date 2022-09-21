const { passportAuth } = require('../middleware/passport');
const { getInstance } = require('../../lib/logger').default;

const logger = getInstance();

module.exports = (Router, Service) => {
  Router.get('/users-referrals', passportAuth, async (req, res) => {
    const { user } = req;

    try {
      const referrals = await Service.UsersReferrals.getByUserId(user.id);
      res.status(200).send(referrals);
    } catch (err) {
      const errMessage = `Error getting user referrals: ${err}`;

      logger.error(errMessage);
      res.status(400).send({ error: errMessage });
    }
  });

  Router.post('/apply-referral/:type?', async (req, res) => {
    const type = req.params.type;
    let userId, email, key, uuid;
    if (type === 'typeform') {
      key = 'complete-survey';
      userId = null;
      email = req.body.form_response?.hidden?.email;
      uuid = req.body.form_response?.hidden?.uuid;
    } else {
      userId = req.body.userId;
      email = req.body.email;
      key = req.body.key;
    }
    if (!key) {
      return res.status(400).send({ error: 'Missing referral key' });
    }
    if (!userId && uuid) {
      const user = await Service.User.FindUserByUuid(uuid);
      userId = user.id;
    }
    if (!userId && email) {
      const user = await Service.User.FindUserByEmail(email);
      userId = user.id;
    }
    if (!userId && !email) {
      return res.status(400).send({ error: 'UserId, Email or UUID are required' });
    }
    try {
      Service.UsersReferrals.applyUserReferral(userId, key).catch((err) => {
        logger.error(err);
      });
      res.status(200).send();
    } catch (err) {
      const errMessage = `Error applying user referral for user with id: ${userId}, error: ${err}`;

      logger.error(errMessage);
      res.status(400).send({ error: errMessage });
    }
  });
};
