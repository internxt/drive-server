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

  Router.post('/apply-referral', async (req, res) => {
    let {userId, email, key} = req.body;
    if(!key) {
      return res.status(400).send({error: 'Missing referral key'});
    }
    if(!userId && email) {
      const user = await Service.User.FindUserByEmail(email);
      userId = user.id;
    }
    if(!userId && !email) {
      return res.status(400).send({ error: 'UserId or Email are required' });
    }
    try {
      Service.UsersReferrals.applyUserReferral(userId,  key).catch((err) => {
        this.logReferralError(userId, err);
      });
      res.status(200).send();
    } catch (err) {
      const errMessage = `Error getting user referrals: ${err}`;

      logger.error(errMessage);
      res.status(400).send({ error: errMessage });
    }
  });
};
