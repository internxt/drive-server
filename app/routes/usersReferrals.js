const { passportAuth } = require('../middleware/passport');
const { getInstance } = require('../../lib/logger');

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
};
