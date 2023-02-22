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
    let userId, email, key, uuid, clientId;

    if (type === 'typeform') {
      key = 'complete-survey';
      userId = null;
      clientId = req.body.form_response?.hidden?.clientid;
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
      if (user) {
        userId = user.id;
      }
    }
    if (!userId && email) {
      const user = await Service.User.FindUserByEmail(email);
      if (user) {
        userId = user.id;
      }
    }
    if (!userId) {
      return res.status(400).send({ error: 'User couldn\'t be found' });
    }
    try {
      await Service.UsersReferrals.applyUserReferral(userId, key).catch((err) => {
        logger.error(err);
      });
      if (clientId && uuid) {
        Service.Notifications.userStorageUpdated({ uuid, clientId });
      }
      res.status(200).send();
    } catch (err) {
      const errMessage = `Error applying user referral for user with id: ${userId}, error: ${err}`;

      logger.error(errMessage);
      res.status(400).send({ error: errMessage });
    }
  });
};
